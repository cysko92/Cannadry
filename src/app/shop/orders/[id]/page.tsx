import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/button";
import { ORDER_SELECT, OrderDetail, OrderProgress, type OrderDetailData } from "@/components/order-detail";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireBuyer } from "@/lib/viewer";
import { reorder } from "../actions";
import { CancelForm } from "./cancel-form";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/shop/orders/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await requireBuyer();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .order("created_at", { referencedTable: "order_events" })
    .maybeSingle();
  if (!order) notFound();
  const isStaff = !!viewer.profile?.is_admin;

  return (
    <div className="container-page py-10">
      <Link href="/shop/orders" className="text-sm underline underline-offset-2">← Orders</Link>
      {sp.placed && (
        <p role="status" className="mt-6 rounded-sm border border-moss bg-success-tint px-4 py-3 text-sm">
          Purchase order submitted. We emailed you a confirmation and will review it shortly.
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">{order.po_number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm text-ink-muted">Placed {formatDateTime(order.created_at)}</p>
        </div>
        {!isStaff && (
          <form action={reorder}>
            <input type="hidden" name="order_id" value={order.id} />
            <Button type="submit" variant="secondary">Re-order</Button>
          </form>
        )}
      </div>
      <div className="mt-8 max-w-2xl">
        <OrderProgress status={order.status} />
      </div>
      <div className="mt-8">
        <OrderDetail order={order as unknown as OrderDetailData} />
      </div>
      {!isStaff && order.status === "submitted" && (
        <div className="mt-8 max-w-xl">
          <CancelForm orderId={order.id} />
        </div>
      )}
    </div>
  );
}
