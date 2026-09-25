import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/product-tile";
import { casePrice } from "@/lib/catalogue";
import { formatDate, formatMoney, formatPct } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireBuyer } from "@/lib/viewer";
import { AddToCart } from "./add-to-cart";

export const metadata: Metadata = { title: "Product" };

type Terpene = { name: string; pct: number };

export default async function ProductPage({ params }: PageProps<"/shop/products/[id]">) {
  const { id } = await params;
  const viewer = await requireBuyer();
  const supabase = await createClient();

  const { data: p } = await supabase.from("catalogue").select("*").eq("id", id).maybeSingle();
  if (!p || (p.status !== "published" && !viewer.profile?.is_admin)) notFound();

  const { data: lots } = await supabase
    .from("product_lots")
    .select("*")
    .eq("product_id", id)
    .eq("active", true)
    .order("packaging_date", { ascending: false });

  const specs: [string, string][] = [
    ["Category", p.category_name ?? "—"],
    ["Format", p.format ?? "—"],
    ["Size", p.size_label ?? "—"],
    ["Case size", `${p.units_per_case} units`],
    ["Price per case", formatMoney(casePrice(p))],
    ["Minimum order", `${p.min_order_units} units`],
    ["Lead time", `${p.lead_time_days} business days`],
    ["Licence holder", `${p.producer_name} · Licence ${p.producer_licence}`],
  ];

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap gap-2 text-ink-muted">
          <li><Link href="/shop" className="underline underline-offset-2">Catalogue</Link> /</li>
          <li><Link href={`/shop?category=${p.category_slug}`} className="underline underline-offset-2">{p.category_name}</Link> /</li>
          <li aria-current="page" className="text-forest">{p.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1fr_20rem]">
        <div>
          <ProductTile category={p.category_name ?? ""} slug={p.category_slug ?? ""} size={p.size_label ?? ""} />
        </div>
        <div>
          <h1 className="text-4xl leading-tight">{p.name}</h1>
          <p className="mt-2">
            <Link href={`/shop/producers/${p.producer_id}`} className="underline underline-offset-2">{p.producer_name}</Link>
            <span className="text-ink-muted"> · Licence {p.producer_licence}</span>
          </p>
          {p.status !== "published" && (
            <p className="mt-3 inline-block rounded-sm bg-cedar px-2 py-0.5 text-xs text-paper">Not published · staff preview</p>
          )}
          {p.description && <p className="mt-5 leading-relaxed">{p.description}</p>}
          <dl className="mt-6 divide-y divide-stone/50 border-y border-stone/50 text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5">
                <dt className="text-ink-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="self-start rounded-sm border border-stone/60 bg-paper p-5" aria-labelledby="order-heading">
          <h2 id="order-heading" className="sr-only">Order</h2>
          <p className="text-2xl font-medium">
            {formatMoney(p.price_per_unit_cents)} <span className="text-sm font-normal text-ink-muted">/ unit</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">CAD, before taxes and excise.</p>
          <div className="mt-5">
            <AddToCart
              lots={(lots ?? []).map((l) => ({ id: l.id, lot_number: l.lot_number, stock_units: l.stock_units, orderable: l.stock_units > 0 && !!l.coa_path }))}
              unitsPerCase={p.units_per_case ?? 1}
              minUnits={p.min_order_units ?? 1}
              pricePerUnitCents={p.price_per_unit_cents ?? 0}
              disabledReason={viewer.profile?.is_admin ? "Staff preview: ordering is disabled." : undefined}
            />
          </div>
        </aside>
      </div>

      <section aria-labelledby="lots-heading" className="mt-14">
        <h2 id="lots-heading" className="text-2xl">Lots and certificates of analysis</h2>
        <div className="mt-4 overflow-x-auto rounded-sm border border-stone/60 bg-paper">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Lot / batch</th>
                <th scope="col" className="px-4 py-3 font-medium">Harvested</th>
                <th scope="col" className="px-4 py-3 font-medium">Packaged</th>
                <th scope="col" className="px-4 py-3 font-medium">THC</th>
                <th scope="col" className="px-4 py-3 font-medium">CBD</th>
                <th scope="col" className="px-4 py-3 font-medium">Dominant terpenes</th>
                <th scope="col" className="px-4 py-3 font-medium">In stock</th>
                <th scope="col" className="px-4 py-3 font-medium">COA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/40">
              {(lots ?? []).map((l) => {
                const terps = (Array.isArray(l.terpenes) ? (l.terpenes as Terpene[]) : []).slice(0, 3);
                return (
                  <tr key={l.id}>
                    <th scope="row" className="px-4 py-3 font-medium">{l.lot_number}</th>
                    <td className="px-4 py-3">{formatDate(l.harvest_date)}</td>
                    <td className="px-4 py-3">{formatDate(l.packaging_date)}</td>
                    <td className="px-4 py-3">{formatPct(l.thc_pct)}</td>
                    <td className="px-4 py-3">{formatPct(l.cbd_pct)}</td>
                    <td className="px-4 py-3">{terps.length ? terps.map((t) => `${t.name} ${t.pct}%`).join(", ") : "—"}</td>
                    <td className="px-4 py-3">{l.stock_units.toLocaleString("en-CA")} units</td>
                    <td className="px-4 py-3">
                      {l.coa_path ? (
                        <a href={`/documents/coa/${l.id}`} className="underline underline-offset-2">
                          Download<span className="sr-only"> COA for lot {l.lot_number}</span> (PDF)
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {!lots?.length && (
                <tr><td colSpan={8} className="px-4 py-6 text-ink-muted">No active lots.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Values are from each lot&rsquo;s certificate of analysis. Edibles and oils state cannabinoid content per package in the format.
        </p>
      </section>
    </div>
  );
}
