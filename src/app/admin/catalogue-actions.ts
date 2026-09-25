"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { MAX_UPLOAD_BYTES } from "@/lib/licence";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/viewer";

const fieldErrors = (e: z.ZodError) => z.flattenError(e).fieldErrors as FormState["errors"];
const dbMessage = (m: string) => (/duplicate key/.test(m) ? "That value is already used." : m);

// ---------------------------------------------------------------------------
// Producers
// ---------------------------------------------------------------------------
const producerSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(160),
  licence_number: z.string().trim().min(1, "Enter the licence number.").max(60),
  city: z.string().trim().max(120).optional(),
  province: z.string().trim().max(60).optional(),
  description: z.string().trim().max(2000).optional(),
  active: z.string().optional(),
});

export async function saveProducer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = producerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { active, ...rest } = parsed.data;
  const row = { ...rest, city: rest.city || null, province: rest.province || null, description: rest.description || null, active: active === "on" };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("producers").update(row).eq("id", id)
    : await supabase.from("producers").insert(row);
  if (error) return { message: dbMessage(error.message) };
  revalidatePath("/admin/producers");
  return { ok: true, message: id ? "Producer saved." : "Producer added." };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(60),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  sort_order: z.coerce.number().int().min(0).max(999),
  active: z.string().optional(),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const row = { ...parsed.data, active: parsed.data.active === "on" };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);
  if (error) return { message: dbMessage(error.message) };
  revalidatePath("/admin/categories");
  return { ok: true, message: id ? "Category saved." : "Category added." };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
// Words that suggest health or therapeutic claims are not allowed in product text.
const CLAIM_WORDS =
  /\b(cure[sd]?|heal(s|ing)?|treat(s|ment)?|reliev(e|es|ing)|relief|therapeutic|medicinal benefit|anxiety|insomnia|sleep aid|pain|depression|remed(y|ies)|wellness benefits?)\b/i;

const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(160),
  producer_id: z.uuid("Choose a producer."),
  category_id: z.uuid("Choose a category."),
  description: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !CLAIM_WORDS.test(v), "Remove health or therapeutic claims. Describe facts only.")
    .optional(),
  format: z.string().trim().min(2, "Enter the format.").max(120),
  size_label: z.string().trim().min(1, "Enter the size.").max(60),
  units_per_case: z.coerce.number().int("Whole number.").min(1),
  price: z.coerce.number().min(0, "Enter a price.").max(1_000_000),
  min_order_units: z.coerce.number().int("Whole number.").min(1),
  lead_time_days: z.coerce.number().int("Whole number.").min(0).max(365),
});

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { price, ...rest } = parsed.data;
  if (CLAIM_WORDS.test(rest.name)) return { errors: { name: ["Remove health or therapeutic claims."] } };
  const row = { ...rest, description: rest.description || null, price_per_unit_cents: Math.round(price * 100) };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return { message: dbMessage(error.message) };
    revalidatePath(`/admin/products/${id}`);
    return { ok: true, message: "Product saved." };
  }
  const { data, error } = await supabase.from("products").insert({ ...row, status: "draft" }).select("id").single();
  if (error) return { message: dbMessage(error.message) };
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function setProductStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as "draft" | "published" | "archived";
  if (!["draft", "published", "archived"].includes(status)) return { message: "Unknown status." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) return { message: error.message.replace(/^Cannot publish: /, "Cannot publish yet: ") };
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
  return { ok: true, message: `Product ${status === "published" ? "published" : status === "draft" ? "moved to draft" : "archived"}.` };
}

// ---------------------------------------------------------------------------
// Lots and COAs
// ---------------------------------------------------------------------------
const dateOrNull = z
  .string()
  .trim()
  .transform((v) => v || null)
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date.");
const pctOrNull = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 100), "Between 0 and 100.");

const lotSchema = z.object({
  product_id: z.uuid(),
  lot_number: z.string().trim().min(1, "Enter the lot number.").max(60),
  harvest_date: dateOrNull,
  packaging_date: dateOrNull,
  thc_pct: pctOrNull,
  cbd_pct: pctOrNull,
  terpenes: z.string().trim().max(500).optional(),
  stock_units: z.coerce.number().int("Whole number.").min(0),
  active: z.string().optional(),
});

/** "Myrcene 0.9, Limonene 0.4" -> [{name, pct}] */
function parseTerpenes(input?: string) {
  if (!input) return { value: [] as { name: string; pct: number }[] };
  const out: { name: string; pct: number }[] = [];
  for (const part of input.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(.+?)\s+([\d.]+)\s*%?$/);
    if (!m || !Number.isFinite(Number(m[2]))) return { error: `Could not read "${part}". Use the form "Myrcene 0.9".` };
    out.push({ name: m[1].trim(), pct: Number(m[2]) });
  }
  return { value: out };
}

async function uploadCoa(productId: string, lotNumber: string, file: File) {
  if (file.type !== "application/pdf") return { error: "The COA must be a PDF." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "The COA must be 4 MB or smaller." };
  const supabase = await createClient();
  const path = `${productId}/${lotNumber.replace(/[^\w.-]+/g, "_")}-${crypto.randomUUID().slice(0, 8)}.pdf`;
  const { error } = await supabase.storage.from("coas").upload(path, file, { contentType: "application/pdf" });
  return error ? { error: error.message } : { path };
}

export async function saveLot(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = lotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const terps = parseTerpenes(parsed.data.terpenes);
  if (terps.error) return { errors: { terpenes: [terps.error] } };

  const file = formData.get("coa");
  let coaPath: string | undefined;
  if (file instanceof File && file.size > 0) {
    const up = await uploadCoa(parsed.data.product_id, parsed.data.lot_number, file);
    if (up.error) return { errors: { coa: [up.error] } };
    coaPath = up.path;
  } else if (!id) {
    return { errors: { coa: ["Upload the certificate of analysis (PDF)."] } };
  }

  const { terpenes: _t, active, ...rest } = parsed.data;
  void _t;
  const row = { ...rest, terpenes: terps.value, active: active === "on", ...(coaPath ? { coa_path: coaPath } : {}) };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("product_lots").update(row).eq("id", id)
    : await supabase.from("product_lots").insert(row);
  if (error) return { message: /duplicate key/.test(error.message) ? "This lot number already exists for this product." : error.message };
  revalidatePath(`/admin/products/${parsed.data.product_id}`);
  return { ok: true, message: id ? `Lot ${rest.lot_number} saved.` : `Lot ${rest.lot_number} added.` };
}
