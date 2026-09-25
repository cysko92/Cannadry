import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** COA download: row-level security decides whether the caller may see the lot. */
export async function GET(_req: NextRequest, { params }: RouteContext<"/documents/coa/[lotId]">) {
  const { lotId } = await params;
  const supabase = await createClient();
  const { data: lot } = await supabase.from("product_lots").select("coa_path, lot_number").eq("id", lotId).maybeSingle();
  if (!lot?.coa_path) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabase.storage
    .from("coas")
    .createSignedUrl(lot.coa_path, 60, { download: `COA-${lot.lot_number}.pdf` });
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
