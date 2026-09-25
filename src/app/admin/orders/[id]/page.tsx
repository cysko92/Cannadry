import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_SELECT, OrderDetail, OrderProgress, type OrderDetailData } from "@/components/order-detail";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { InvoiceForm, OrderActions } from "./order-actions";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(`${ORDER_SELECT}, placed_by, company:companies(id, legal_name, licence_type, licence_number, province, status, contact_email, contact_phone)`)
    .eq("id", id)
    .order("created_at", { referencedTable: "order_events" })
    .maybeSingle();
  if (!order) notFound();
  const { data: placer } = await supabase.from("profiles").select("full_name, email").eq("id", order.placed_by).maybeSingle();
  const c = order.company;

  return (
    <div className="container-page py-10">
      <Link href="/admin/orders" className="text-sm underline underline-offset-2">← Orders</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{order.po_number}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Placed {formatDateTime(order.created_at)} by {placer?.full_name} ({placer?.email})
      </p>
      <div className="mt-6 max-w-2xl"><OrderProgress status={order.status} /></div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <OrderDetail order={order as unknown as OrderDetailData} />
        <div className="space-y-6">
          <section aria-labelledby="buyer" className="rounded-sm border border-stone/60 bg-paper p-5">
            <h2 id="buyer" className="text-xl">Buyer</h2>
            {c && (
              <dl className="mt-3 space-y-1 text-sm">
                <dt className="sr-only">Company</dt>
                <dd><Link href={`/admin/companies/${c.id}`} className="font-medium underline underline-offset-2">{c.legal_name}</Link> <StatusBadge status={c.status} /></dd>
                <dt className="sr-only">Licence</dt>
                <dd>{c.licence_type} · {c.licence_number}</dd>
                <dt className="sr-only">Province</dt>
                <dd>{c.province}</dd>
                <dt className="sr-only">Contact</dt>
                <dd className="text-ink-muted">{c.contact_email} · {c.contact_phone}</dd>
              </dl>
            )}
          </section>
          <section aria-labelledby="actions" className="rounded-sm border border-stone/60 bg-paper p-5">
            <h2 id="actions" className="text-xl">Update status</h2>
            <div className="mt-4"><OrderActions orderId={order.id} status={order.status} /></div>
          </section>
          <section aria-labelledby="invoice" className="rounded-sm border border-stone/60 bg-paper p-5">
            <h2 id="invoice" className="text-xl">Invoice</h2>
            <div className="mt-4"><InvoiceForm orderId={order.id} hasInvoice={!!order.invoice_path} /></div>
          </section>
        </div>
      </div>
    </div>
  );
}
