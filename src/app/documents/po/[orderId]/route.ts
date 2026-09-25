import { NextResponse, type NextRequest } from "next/server";
import { renderPurchaseOrder, type PoData } from "@/lib/po-pdf";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: RouteContext<"/documents/po/[orderId]">) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "po_number, created_at, status, notes, subtotal_cents, placed_by, company:companies(legal_name, licence_type, licence_number, address, province), items:order_items(snapshot, quantity_units, unit_price_cents, line_total_cents)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order?.company) return new NextResponse("Not found", { status: 404 });

  const { data: placer } = await supabase.from("profiles").select("full_name").eq("id", order.placed_by).maybeSingle();
  const bytes = await renderPurchaseOrder({
    ...order,
    placed_by: placer?.full_name ?? null,
    items: order.items as PoData["items"],
  } as PoData);

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="PO-${order.po_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
