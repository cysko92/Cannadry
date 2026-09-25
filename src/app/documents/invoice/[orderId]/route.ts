import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: RouteContext<"/documents/invoice/[orderId]">) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("invoice_path, po_number").eq("id", orderId).maybeSingle();
  if (!order?.invoice_path) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabase.storage
    .from("invoices")
    .createSignedUrl(order.invoice_path, 60, { download: `Invoice-${order.po_number}.pdf` });
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
