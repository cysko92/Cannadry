"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AGE_COOKIE, AGE_COOKIE_MAX_AGE, safeNext } from "@/lib/age-gate";

export async function confirmAge(formData: FormData) {
  const store = await cookies();
  store.set(AGE_COOKIE, "1", {
    maxAge: AGE_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect(safeNext(formData.get("next")?.toString()));
}
