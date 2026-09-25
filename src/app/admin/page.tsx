import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

function monthStart() {
  // First day of the current month in Vancouver time.
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit" }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}-01T00:00:00-08:00`;
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
      {sub && <p className="mt-1 text-sm text-ink-muted">{sub}</p>}
    </>
  );
  return (
    <div className="rounded-sm border border-stone/60 bg-paper p-5">
      {href ? <Link href={href} className="block hover:underline">{body}</Link> : body}
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const since = monthStart();

  const [monthOrders, awaiting, requests, buyers, lots, recent] = await Promise.all([
    supabase
      .from("orders")
      .select("id, subtotal_cents, status, items:order_items(product_id, quantity_units, line_total_cents, snapshot)")
      .gte("created_at", since)
      .not("status", "in", "(rejected,cancelled)"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("product_lots")
      .select("id, lot_number, stock_units, product:products(id, name, status, min_order_units)")
      .eq("active", true)
      .order("stock_units"),
    supabase
      .from("orders")
      .select("id, po_number, status, created_at, subtotal_cents, company:companies(legal_name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const orders = monthOrders.data ?? [];
  const monthValue = orders.reduce((s, o) => s + Number(o.subtotal_cents), 0);

  const byProduct = new Map<string, { name: string; units: number; value: number }>();
  for (const o of orders) {
    for (const i of o.items) {
      const cur = byProduct.get(i.product_id) ?? { name: (i.snapshot as { name?: string })?.name ?? "—", units: 0, value: 0 };
      cur.units += i.quantity_units;
      cur.value += Number(i.line_total_cents);
      byProduct.set(i.product_id, cur);
    }
  }
  const top = [...byProduct.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 5);

  const lowStock = (lots.data ?? [])
    .filter((l) => l.product?.status === "published" && l.stock_units < (l.product.min_order_units ?? 1) * 2)
    .slice(0, 8);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-ink-muted">This month excludes rejected and cancelled orders.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Orders this month" value={String(orders.length)} sub={`${formatMoney(monthValue)} subtotal`} href="/admin/orders" />
        <Stat label="Awaiting your review" value={String(awaiting.count ?? 0)} sub="Submitted purchase orders" href="/admin/orders?status=submitted" />
        <Stat label="Access requests" value={String(requests.count ?? 0)} sub="Pending licence checks" href="/admin/requests" />
        <Stat label="Approved buyers" value={String(buyers.count ?? 0)} href="/admin/companies?status=approved" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="top" className="rounded-sm border border-stone/60 bg-paper p-5">
          <h2 id="top" className="text-xl">Top products this month</h2>
          {top.length ? (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-muted">
                <tr><th scope="col" className="pb-2 font-medium">Product</th><th scope="col" className="pb-2 text-right font-medium">Units</th><th scope="col" className="pb-2 text-right font-medium">Value</th></tr>
              </thead>
              <tbody className="divide-y divide-stone/40">
                {top.map(([id, t]) => (
                  <tr key={id}>
                    <td className="py-2"><Link href={`/admin/products/${id}`} className="underline-offset-2 hover:underline">{t.name}</Link></td>
                    <td className="py-2 text-right">{t.units.toLocaleString("en-CA")}</td>
                    <td className="py-2 text-right">{formatMoney(t.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="mt-4 text-sm text-ink-muted">No orders yet this month.</p>}
        </section>

        <section aria-labelledby="low" className="rounded-sm border border-stone/60 bg-paper p-5">
          <h2 id="low" className="text-xl">Low stock</h2>
          <p className="mt-1 text-xs text-ink-muted">Published lots with less than two minimum orders left.</p>
          {lowStock.length ? (
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-muted">
                <tr><th scope="col" className="pb-2 font-medium">Product / lot</th><th scope="col" className="pb-2 text-right font-medium">Units left</th></tr>
              </thead>
              <tbody className="divide-y divide-stone/40">
                {lowStock.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2">
                      <Link href={`/admin/products/${l.product!.id}`} className="underline-offset-2 hover:underline">{l.product!.name}</Link>
                      <span className="text-ink-muted"> · {l.lot_number}</span>
                    </td>
                    <td className="py-2 text-right font-medium">{l.stock_units.toLocaleString("en-CA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="mt-4 text-sm text-ink-muted">Stock levels are fine.</p>}
        </section>
      </div>

      <section aria-labelledby="recent" className="mt-8 rounded-sm border border-stone/60 bg-paper p-5">
        <div className="flex items-center justify-between">
          <h2 id="recent" className="text-xl">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm underline underline-offset-2">All orders</Link>
        </div>
        <ul className="mt-3 divide-y divide-stone/40 text-sm">
          {(recent.data ?? []).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span>
                <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">{o.po_number}</Link>
                <span className="text-ink-muted"> · {o.company?.legal_name} · {formatDate(o.created_at)}</span>
              </span>
              <span className="flex items-center gap-3">{formatMoney(o.subtotal_cents)} <StatusBadge status={o.status} /></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
