import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit log" };

const PAGE = 50;
const ENTITIES = ["company", "order", "products", "product_lots", "producers", "categories"] as const;

function summary(action: string, data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.changes && typeof d.changes === "object") {
    return Object.entries(d.changes as Record<string, { from: unknown; to: unknown }>)
      .map(([k, v]) => `${k}: ${JSON.stringify(v.from)} → ${JSON.stringify(v.to)}`)
      .join("; ")
      .slice(0, 240);
  }
  if (d.new && typeof d.new === "object") {
    const n = d.new as Record<string, unknown>;
    return String(n.name ?? n.lot_number ?? n.legal_name ?? "");
  }
  if (d.note) return String(d.note);
  if (action.startsWith("company.requested")) return `${d.legal_name ?? ""} · ${d.licence_number ?? ""}`;
  if (d.subtotal_cents != null) return `Subtotal ${(Number(d.subtotal_cents) / 100).toFixed(2)} CAD`;
  return "";
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const params = await searchParams;
  const entity = ENTITIES.find((e) => e === params.entity);
  const page = Math.max(1, Number(params.page) || 1);
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (entity) query = query.eq("entity", entity);
  const { data: rows, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(entity ? { entity } : {}), page: String(p) })}`;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Audit log</h1>
          <p className="mt-2 text-sm text-ink-muted">Every account, catalogue and order action with its date and user. Entries cannot be edited or deleted.</p>
        </div>
        <a href="/admin/audit/export" className="rounded-sm border border-forest px-4 py-2 text-sm font-medium hover:bg-forest hover:text-fog">Export CSV</a>
      </div>
      <nav aria-label="Filter by type" className="mt-6">
        <ul className="flex flex-wrap gap-2 text-sm">
          {[undefined, ...ENTITIES].map((e) => (
            <li key={e ?? "all"}>
              <Link
                href={e ? `/admin/audit?entity=${e}` : "/admin/audit"}
                aria-current={e === entity ? "page" : undefined}
                className="block rounded-sm border border-stone px-3 py-1.5 aria-[current=page]:border-forest aria-[current=page]:bg-forest aria-[current=page]:text-fog"
              >
                {e ? e.replace("_", " ") : "all"}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div tabIndex={0} role="region" aria-label="Table, scrolls sideways" className="mt-6 overflow-x-auto rounded-sm border border-stone/60 bg-paper">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">User</th>
              <th scope="col" className="px-4 py-3 font-medium">Action</th>
              <th scope="col" className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone/40">
            {(rows ?? []).map((a) => (
              <tr key={a.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2.5">{formatDateTime(a.created_at)}</td>
                <td className="px-4 py-2.5">{a.actor_name ?? "System"}<br /><span className="text-ink-muted">{a.actor_email}</span></td>
                <td className="px-4 py-2.5 font-medium">
                  {a.entity === "order" && a.entity_id ? <Link href={`/admin/orders/${a.entity_id}`} className="underline underline-offset-2">{a.action}</Link>
                    : a.entity === "company" && a.entity_id ? <Link href={`/admin/companies/${a.entity_id}`} className="underline underline-offset-2">{a.action}</Link>
                    : a.entity === "products" && a.entity_id && !a.action.endsWith("delete") ? <Link href={`/admin/products/${a.entity_id}`} className="underline underline-offset-2">{a.action}</Link>
                    : a.action}
                </td>
                <td className="max-w-md break-words px-4 py-2.5 text-ink-muted">{summary(a.action, a.data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
        <span className="text-ink-muted">Page {page} of {pages} · {count ?? 0} entries</span>
        <span className="flex gap-4">
          {page > 1 && <Link href={href(page - 1)} className="underline underline-offset-2">Previous</Link>}
          {page < pages && <Link href={href(page + 1)} className="underline underline-offset-2">Next</Link>}
        </span>
      </nav>
    </div>
  );
}
