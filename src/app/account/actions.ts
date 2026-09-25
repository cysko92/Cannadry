"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^([+()\d\s.-]{7,25})?$/, "Enter a valid phone number."),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { message: "Please sign in again." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", viewer.user.id);
  if (error) return { message: "Could not save your details." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}
