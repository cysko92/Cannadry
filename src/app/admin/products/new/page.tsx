import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";
import { saveProduct } from "../../catalogue-actions";
import { productFields } from "../product-fields";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: producers }, { data: categories }] = await Promise.all([
    supabase.from("producers").select("id, name").eq("active", true).order("name"),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);
  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/admin/products" className="text-sm underline underline-offset-2">← Products</Link>
      <h1 className="mt-4 text-3xl">Add product</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The product is saved as a draft. Add at least one lot with its COA, then publish it.
      </p>
      <div className="mt-8 rounded-sm border border-stone/60 bg-paper p-6">
        <ActionForm action={saveProduct} fields={productFields(producers ?? [], categories ?? [])} submitLabel="Save draft" />
      </div>
    </div>
  );
}
