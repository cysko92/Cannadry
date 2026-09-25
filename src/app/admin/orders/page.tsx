import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Orders" };

const FILTERS = ["all", "submitted", "accepted", "shipped", "delivered", "rejected", "cancelled"] as const;
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const status = FILTERS.find((f) => f === params.status) ?? "all";
  const from = isDate(params.from) ? params.from : "";
  const to = isDate(params.to) ? params.to : "";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, po_number, status, created_at, subtotal_cents, invoice_path, company:companies(legal_name)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (status !== "all") query = query.eq("status", status as Enums<"order_status">);
  if (from) query = query.gte("created_at", `${from}T00:00:00-08:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59-08:00`);
  const { data: orders } = await query;

  const exportQs = new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Orders</h1>
        <a href={`/admin/orders/export${exportQs ? `?${exportQs}` : ""}`} className="rounded-sm border border-forest px-4 py-2 text-sm font-medium hover:bg-forest hover:text-fog">
          Export CSV
        </a>
      </div>
      <form className="mt-6 flex flex-wrap items-end gap-3 text-sm" aria-label="Filter orders">
        <label>
          <span className="block font-medium">Status</span>
          <select name="status" defaultValue={status} className="mt-1 rounded-sm border border-stone bg-paper px-2.5 py-1.5 capitalize">
            {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label>
          <span className="block font-medium">From</span>
          <input type="date" name="from" defaultValue={from} className="mt-1 rounded-sm border border-stone bg-paper px-2.5 py-1.5" />
        </label>
        <label>
          <span className="block font-medium">To</span>
          <input type="date" name="to" defaultValue={to} className="mt-1 rounded-sm border border-stone bg-paper px-2.5 py-1.5" />
        </label>
        <button type="submit" className="rounded-sm bg-forest px-4 py-2 font-medium text-fog">Apply</button>
        <Link href="/admin/orders" className="py-2 underline underline-offset-2">Clear</Link>
      </form>
      <div className="mt-6 overflow-x-auto rounded-sm border border-stone/60 bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">PO number</th>
              <th scope="col" className="px-4 py-3 font-medium">Buyer</th>
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Subtotal</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone/40">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-fog">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">{o.po_number}</Link></td>
                <td className="px-4 py-3">{o.company?.legal_name}</td>
                <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3">{formatMoney(o.subtotal_cents)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3">{o.invoice_path ? "Attached" : "—"}</td>
              </tr>
            ))}
            {!orders?.length && <tr><td colSpan={6} className="px-4 py-8 text-ink-muted">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
