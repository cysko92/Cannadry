"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { safeNext } from "@/lib/age-gate";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getViewer, homeFor } from "@/lib/viewer";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email || !password) {
    return { message: "Enter your email and password.", values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = /confirm/i.test(error.message)
      ? "Please confirm your email address first. Check your inbox for the link."
      : "Email or password is incorrect.";
    return { message, values: { email } };
  }

  const viewer = await getViewer();
  const home = viewer ? homeFor(viewer) : "/pending";
  // Only honour ?next= when it points inside the area this user may use.
  const target = safeNext(next);
  redirect(target !== "/" && target.startsWith(home) ? target : home);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function sendPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { message: "Enter a valid email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${env.siteUrl()}/auth/confirm?next=/update-password`,
  });
  // Same answer whether or not the account exists.
  return { ok: true, message: "If an account exists for this email, we sent a link to reset your password." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");
  if (password.length < 10) return { errors: { password: ["Use at least 10 characters."] } };
  if (password !== confirm) return { errors: { password_confirm: ["Passwords do not match."] } };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: "The reset link has expired. Request a new one." };

  const viewer = await getViewer();
  redirect(viewer ? homeFor(viewer) : "/login");
}
