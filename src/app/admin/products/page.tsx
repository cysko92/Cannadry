import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Products" };

const FILTERS = ["all", "published", "draft", "archived"] as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const params = await searchParams;
  const status = FILTERS.find((f) => f === params.status) ?? "all";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const supabase = await createClient();
  let query = supabase.from("catalogue").select("*").order("name");
  if (status !== "all") query = query.eq("status", status as Enums<"product_status">);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  const { data: products } = await query;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Products</h1>
        <ButtonLink href="/admin/products/new">Add product</ButtonLink>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-2 text-sm">
            {FILTERS.map((f) => (
              <li key={f}>
                <Link
                  href={f === "all" ? "/admin/products" : `/admin/products?status=${f}`}
                  aria-current={f === status ? "page" : undefined}
                  className="block rounded-sm border border-stone px-3 py-1.5 capitalize aria-[current=page]:border-forest aria-[current=page]:bg-forest aria-[current=page]:text-fog"
                >
                  {f}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form role="search" className="flex gap-2">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <label htmlFor="q" className="sr-only">Search products</label>
          <input id="q" name="q" defaultValue={q} placeholder="Product name" className="w-56 rounded-sm border border-stone bg-paper px-3 py-1.5 text-sm" />
          <button type="submit" className="rounded-sm border border-forest px-3 py-1.5 text-sm">Search</button>
        </form>
      </div>
      <div tabIndex={0} role="region" aria-label="Table, scrolls sideways" className="mt-6 overflow-x-auto rounded-sm border border-stone/60 bg-paper">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="px-4 py-3 font-medium">Producer</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Price / unit</th>
              <th scope="col" className="px-4 py-3 font-medium">Stock</th>
              <th scope="col" className="px-4 py-3 font-medium">Lots</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone/40">
            {(products ?? []).map((p) => {
              const low = (p.stock_units ?? 0) < (p.min_order_units ?? 1) * 2;
              return (
                <tr key={p.id} className="hover:bg-fog">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium underline-offset-2 hover:underline">{p.name}</Link>
                    <br />
                    <span className="text-ink-muted">{p.format} · {p.size_label}</span>
                  </td>
                  <td className="px-4 py-3">{p.producer_name}</td>
                  <td className="px-4 py-3">{p.category_name}</td>
                  <td className="px-4 py-3">{formatMoney(p.price_per_unit_cents)}</td>
                  <td className={`px-4 py-3 ${low ? "font-medium text-danger" : ""}`}>
                    {(p.stock_units ?? 0).toLocaleString("en-CA")}{low && <span className="block text-xs">Low</span>}
                  </td>
                  <td className="px-4 py-3">{p.lot_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status ?? "draft"} /></td>
                </tr>
              );
            })}
            {!products?.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-ink-muted">No products.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
