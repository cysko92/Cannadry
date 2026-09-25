import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, type FieldSpec } from "@/components/action-form";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatPct } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { saveLot, saveProduct } from "../../catalogue-actions";
import { productFields } from "../product-fields";
import { StatusForm } from "./status-form";

export const metadata: Metadata = { title: "Edit product" };

type Terpene = { name: string; pct: number };
const terpText = (t: unknown) => (Array.isArray(t) ? (t as Terpene[]).map((x) => `${x.name} ${x.pct}`).join(", ") : "");

const lotFields = (productId: string, l?: Tables<"product_lots">): FieldSpec[] => [
  { name: "id", label: "", type: "hidden", defaultValue: l?.id ?? "" },
  { name: "product_id", label: "", type: "hidden", defaultValue: productId },
  { name: "lot_number", label: "Lot / batch number", defaultValue: l?.lot_number },
  { name: "stock_units", label: "Stock (units)", type: "number", min: 0, step: "1", defaultValue: l?.stock_units ?? 0 },
  { name: "harvest_date", label: "Harvest date", type: "date", optional: true, defaultValue: l?.harvest_date },
  { name: "packaging_date", label: "Packaging date", type: "date", optional: true, defaultValue: l?.packaging_date },
  { name: "thc_pct", label: "Total THC %", type: "number", min: 0, max: 100, step: "0.01", optional: true, defaultValue: l?.thc_pct, hint: "Leave empty for edibles (state mg in the format)." },
  { name: "cbd_pct", label: "Total CBD %", type: "number", min: 0, max: 100, step: "0.01", optional: true, defaultValue: l?.cbd_pct },
  { name: "terpenes", label: "Dominant terpenes", optional: true, wide: true, hint: "Name and %, comma separated: Myrcene 0.9, Limonene 0.4", defaultValue: terpText(l?.terpenes) },
  {
    name: "coa",
    label: l ? "Replace COA (PDF)" : "Certificate of analysis (PDF)",
    type: "file",
    accept: "application/pdf",
    optional: !!l,
    hint: "Up to 4 MB.",
  },
  { name: "active", label: "Active (orderable)", type: "checkbox", defaultValue: l ? l.active : true },
];

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!product) notFound();
  const [{ data: lots }, { data: producers }, { data: categories }] = await Promise.all([
    supabase.from("product_lots").select("*").eq("product_id", id).order("created_at", { ascending: false }),
    supabase.from("producers").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);
  const hasCoaLot = (lots ?? []).some((l) => l.active && l.coa_path);

  return (
    <div className="container-page py-10">
      <Link href="/admin/products" className="text-sm underline underline-offset-2">← Products</Link>
      {sp.created && (
        <p role="status" className="mt-6 rounded-sm border border-moss bg-success-tint px-4 py-3 text-sm">
          Draft saved. Add a lot with its COA below, then publish.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{product.name}</h1>
        <StatusBadge status={product.status} />
        <Link href={`/shop/products/${product.id}`} className="text-sm underline underline-offset-2">Preview as buyer</Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="details" className="rounded-sm border border-stone/60 bg-paper p-6">
          <h2 id="details" className="text-xl">Details</h2>
          <div className="mt-4">
            <ActionForm action={saveProduct} fields={productFields(producers ?? [], categories ?? [], product)} submitLabel="Save product" />
          </div>
        </section>
        <section aria-labelledby="publishing" className="self-start rounded-sm border border-stone/60 bg-paper p-6">
          <h2 id="publishing" className="text-xl">Publishing</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>{hasCoaLot ? "✓" : "✗"} Active lot with a COA</li>
            <li>✓ Licence holder: {producers?.find((p) => p.id === product.producer_id)?.name}</li>
          </ul>
          <p className="mt-3 text-sm text-ink-muted">Only published products are visible to approved buyers.</p>
          <div className="mt-4">
            <StatusForm id={product.id} status={product.status} />
          </div>
        </section>
      </div>

      <section aria-labelledby="lots" className="mt-10">
        <h2 id="lots" className="text-2xl">Lots</h2>
        <ul className="mt-4 space-y-3">
          {(lots ?? []).map((l) => (
            <li key={l.id}>
              <details className="rounded-sm border border-stone/60 bg-paper">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm">
                  <span className="font-medium">Lot {l.lot_number}</span>
                  <span className="text-ink-muted">
                    Packaged {formatDate(l.packaging_date)} · THC {formatPct(l.thc_pct)} · CBD {formatPct(l.cbd_pct)} ·{" "}
                    {l.stock_units.toLocaleString("en-CA")} units · {l.coa_path ? "COA on file" : "No COA"} · {l.active ? "Active" : "Inactive"}
                  </span>
                </summary>
                <div className="border-t border-stone/50 p-5">
                  {l.coa_path && (
                    <p className="mb-4 text-sm">
                      <a href={`/documents/coa/${l.id}`} className="underline underline-offset-2">Download current COA</a>
                    </p>
                  )}
                  <ActionForm action={saveLot} fields={lotFields(product.id, l)} submitLabel="Save lot" />
                </div>
              </details>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-sm border border-stone/60 bg-paper p-6">
          <h3 className="text-xl">Add a lot</h3>
          <div className="mt-4">
            <ActionForm action={saveLot} fields={lotFields(product.id)} submitLabel="Add lot" />
          </div>
        </div>
      </section>
    </div>
  );
}
