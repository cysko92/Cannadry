import { csvResponse, toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

/** Full audit log export (admin only). */
export async function GET() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new Response("Not found", { status: 404 });

  const rows: (string | number | null)[][] = [];
  // Page through the log to avoid the API row limit.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, created_at, actor_name, actor_email, action, entity, entity_id, company_id, data")
      .order("id")
      .range(from, from + 999);
    if (error) return new Response(error.message, { status: 500 });
    for (const a of data ?? []) {
      rows.push([a.id, a.created_at, a.actor_name, a.actor_email, a.action, a.entity, a.entity_id, a.company_id, JSON.stringify(a.data)]);
    }
    if (!data || data.length < 1000) break;
  }
  const csv = toCsv(["id", "created_at_utc", "user_name", "user_email", "action", "entity", "entity_id", "company_id", "details"], rows);
  return csvResponse(`cannadry-audit-log-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
