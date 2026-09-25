import type { NextRequest } from "next/server";
import { csvResponse, toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

type Snap = { name?: string; lot_number?: string; producer?: string; producer_licence?: string; category?: string; size?: string };
const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** One row per order line, for accounting and record-keeping. Admin only (row-level security + check). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new Response("Not found", { status: 404 });

  const sp = request.nextUrl.searchParams;
  let query = supabase
    .from("orders")
    .select(
      "po_number, status, created_at, updated_at, notes, subtotal_cents, invoice_path, placed_by, company:companies(legal_name, licence_type, licence_number, province), items:order_items(snapshot, quantity_units, unit_price_cents, line_total_cents)",
    )
    .order("created_at");
  const status = sp.get("status");
  if (status) query = query.eq("status", status as Enums<"order_status">);
  if (isDate(sp.get("from"))) query = query.gte("created_at", `${sp.get("from")}T00:00:00-08:00`);
  if (isDate(sp.get("to"))) query = query.lte("created_at", `${sp.get("to")}T23:59:59-08:00`);
  const { data: orders, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const { data: people } = await supabase.from("profiles").select("id, full_name, email");
  const who = new Map((people ?? []).map((p) => [p.id, `${p.full_name} <${p.email}>`]));

  const rows = (orders ?? []).flatMap((o) =>
    o.items.map((i) => {
      const s = (i.snapshot ?? {}) as Snap;
      return [
        o.po_number, o.created_at, o.status, o.updated_at,
        o.company?.legal_name, o.company?.licence_type, o.company?.licence_number, o.company?.province,
        who.get(o.placed_by) ?? o.placed_by,
        s.name, s.category, s.size, s.lot_number, s.producer, s.producer_licence,
        i.quantity_units, (i.unit_price_cents / 100).toFixed(2), (Number(i.line_total_cents) / 100).toFixed(2),
        (Number(o.subtotal_cents) / 100).toFixed(2), o.invoice_path ? "yes" : "no", o.notes,
      ];
    }),
  );

  const csv = toCsv(
    [
      "po_number", "created_at_utc", "status", "last_updated_utc",
      "buyer_legal_name", "buyer_licence_type", "buyer_licence_number", "buyer_province", "placed_by",
      "product", "category", "size", "lot_number", "licence_holder", "licence_holder_licence",
      "units", "unit_price_cad", "line_total_cad", "order_subtotal_cad", "invoice_attached", "notes",
    ],
    rows,
  );
  return csvResponse(`cannadry-orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
