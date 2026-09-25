import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireBuyer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requireBuyer("/shop/orders");
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, po_number, status, created_at, subtotal_cents, invoice_path, items:order_items(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl">Orders</h1>
      <p className="mt-2 text-sm text-ink-muted">All purchase orders placed by your company.</p>
      {!orders?.length ? (
        <p className="mt-8 rounded-sm border border-stone/60 bg-paper p-8 text-ink-muted">No orders yet.</p>
      ) : (
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways" className="mt-8 overflow-x-auto rounded-sm border border-stone/60 bg-paper">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">PO number</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Lines</th>
                <th scope="col" className="px-4 py-3 font-medium">Subtotal</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/40">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-fog">
                  <td className="px-4 py-3">
                    <Link href={`/shop/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">{o.po_number}</Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">{o.items?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-3">{formatMoney(o.subtotal_cents)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    {o.invoice_path ? <a href={`/documents/invoice/${o.id}`} className="underline underline-offset-2">PDF<span className="sr-only"> invoice for {o.po_number}</span></a> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
