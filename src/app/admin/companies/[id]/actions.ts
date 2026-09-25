"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form";
import { emails } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/viewer";

type Decision = "approve" | "reject" | "suspend" | "reactivate";

export async function decideCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("company_id") ?? "");
  const decision = String(formData.get("decision") ?? "") as Decision;
  const note = String(formData.get("note") ?? "").trim();

  if ((decision === "reject" || decision === "suspend") && !note) {
    return { errors: { note: ["Give a reason. It is sent to the company and kept in the audit log."] } };
  }

  const supabase = await createClient();
  const { error } =
    decision === "approve" || decision === "reject"
      ? await supabase.rpc("review_company", {
          p_company_id: id,
          p_decision: decision === "approve" ? "approved" : "rejected",
          p_note: note || undefined,
        })
      : decision === "suspend" || decision === "reactivate"
        ? await supabase.rpc("set_company_status", {
            p_company_id: id,
            p_status: decision === "suspend" ? "suspended" : "approved",
            p_note: note || undefined,
          })
        : { error: { message: "Unknown action" } };

  if (error) return { message: error.message };

  const { data: company } = await supabase
    .from("companies")
    .select("legal_name, contact_email")
    .eq("id", id)
    .single();
  if (company) {
    const { legal_name: name, contact_email: to } = company;
    if (decision === "approve") await emails.approved(to, name);
    if (decision === "reject") await emails.rejected(to, name, note);
    if (decision === "suspend") await emails.suspended(to, name, note);
    if (decision === "reactivate") await emails.reactivated(to, name);
  }

  revalidatePath("/admin", "layout");
  const done = { approve: "approved", reject: "rejected", suspend: "suspended", reactivate: "reactivated" }[decision];
  return { ok: true, message: `Company ${done}. The contact has been emailed.` };
}
