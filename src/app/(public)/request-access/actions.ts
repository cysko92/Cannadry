"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { emails } from "@/lib/email";
import { env } from "@/lib/env";
import { LICENCE_FILE_TYPES, LICENCE_TYPES, MAX_UPLOAD_BYTES, PROVINCES } from "@/lib/licence";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z
  .object({
    legal_name: z.string().trim().min(2, "Enter the company's legal name.").max(200),
    licence_type: z.enum(LICENCE_TYPES, { message: "Select a licence type." }),
    licence_number: z.string().trim().min(2, "Enter the licence number.").max(60),
    province: z.enum(PROVINCES, { message: "Select a province or territory." }),
    address: z.string().trim().min(5, "Enter the licensed site address.").max(300),
    contact_name: z.string().trim().min(2, "Enter the contact person's name.").max(120),
    email: z.email("Enter a valid email address.").trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^[+()\d\s.-]{7,25}$/, "Enter a valid phone number."),
    password: z.string().min(10, "Use at least 10 characters.").max(72),
    password_confirm: z.string(),
    confirm_authority: z.literal("on", { message: "Please confirm this statement." }),
    accept_terms: z.literal("on", { message: "Please accept the terms and privacy policy." }),
  })
  .refine((d) => d.password === d.password_confirm, {
    path: ["password_confirm"],
    message: "Passwords do not match.",
  });

const KEEP = ["legal_name", "licence_type", "licence_number", "province", "address", "contact_name", "email", "phone"];

function fail(formData: FormData, message: string, errors?: FormState["errors"]): FormState {
  const values: Record<string, string> = {};
  for (const k of KEEP) values[k] = String(formData.get(k) ?? "");
  return { ok: false, message, errors, values };
}

export async function requestAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: real people never fill this hidden field.
  if (formData.get("website")) return { ok: true, message: "Thank you." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  const file = formData.get("licence_document");
  const fileErrors: string[] = [];
  if (!(file instanceof File) || file.size === 0) fileErrors.push("Upload a copy of your licence.");
  else if (file.size > MAX_UPLOAD_BYTES) fileErrors.push("The file must be 4 MB or smaller.");
  else if (!(LICENCE_FILE_TYPES as readonly string[]).includes(file.type))
    fileErrors.push("Upload a PDF, JPG or PNG file.");

  if (!parsed.success || fileErrors.length) {
    const errors = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;
    return fail(formData, "Please correct the highlighted fields.", {
      ...errors,
      ...(fileErrors.length ? { licence_document: fileErrors } : {}),
    });
  }

  const d = parsed.data;
  const doc = file as File;
  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Create the login.
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${env.siteUrl()}/auth/confirm?next=/pending`,
      data: { full_name: d.contact_name },
    },
  });
  const user = signUp?.user;
  // With email confirmation on, an existing address returns a user without identities.
  if (signUpError || !user || user.identities?.length === 0) {
    const exists = !user || user.identities?.length === 0 || /already/i.test(signUpError?.message ?? "");
    return fail(
      formData,
      exists
        ? "An account already exists for this email. Sign in instead, or use another email."
        : "We could not create your account. Please try again.",
      exists ? { email: ["This email is already registered."] } : undefined,
    );
  }

  // 2. Store the licence document and the request. Undo the login if anything fails.
  const companyId = crypto.randomUUID();
  const safeName = doc.name.replace(/[^\w.-]+/g, "_").slice(-80) || "licence";
  const path = `${companyId}/${crypto.randomUUID()}-${safeName}`;

  const upload = await admin.storage
    .from("licences")
    .upload(path, doc, { contentType: doc.type, upsert: false });

  const request = upload.error
    ? { error: upload.error }
    : await admin.rpc("create_access_request", {
        p_user_id: user.id,
        p_company_id: companyId,
        p_legal_name: d.legal_name,
        p_licence_type: d.licence_type,
        p_licence_number: d.licence_number,
        p_province: d.province,
        p_address: d.address,
        p_contact_name: d.contact_name,
        p_contact_email: d.email,
        p_contact_phone: d.phone,
        p_document_path: path,
        p_document_name: doc.name.slice(0, 200),
      });

  if (request.error) {
    console.error("[request-access] failed", request.error);
    await supabase.auth.signOut();
    await admin.storage.from("licences").remove([path]);
    await admin.auth.admin.deleteUser(user.id);
    return fail(formData, "We could not submit your request. Please try again.");
  }

  await Promise.all([
    emails.requestReceived(d.email, d.legal_name),
    emails.adminNewRequest(d.legal_name, companyId),
  ]);

  // Signed in right away when email confirmation is off; otherwise ask them to confirm.
  if (signUp.session) redirect("/pending?submitted=1");
  return {
    ok: true,
    message: `Request received. We sent a confirmation link to ${d.email}. Confirm your email, then we will review your licence.`,
  };
}
