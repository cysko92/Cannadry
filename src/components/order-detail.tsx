import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatMoney, formatPct } from "@/lib/format";

type Snapshot = {
  name?: string;
  lot_number?: string;
  format?: string;
  size?: string;
  producer?: string;
  producer_licence?: string;
  thc_pct?: number | null;
  cbd_pct?: number | null;
};

export type OrderDetailData = {
  id: string;
  po_number: string;
  status: string;
  created_at: string;
  notes: string | null;
  subtotal_cents: number;
  invoice_path: string | null;
  items: { id: string; snapshot: unknown; quantity_units: number; unit_price_cents: number; line_total_cents: number }[];
  events: { id: string; from_status: string | null; to_status: string; actor_name: string | null; note: string | null; created_at: string }[];
};

const STEPS = ["submitted", "accepted", "shipped", "delivered"] as const;

export function OrderProgress({ status }: { status: string }) {
  if (status === "rejected" || status === "cancelled") return null;
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="grid grid-cols-4 gap-2 text-xs" aria-label="Order progress">
      {STEPS.map((s, i) => (
        <li key={s} className="space-y-1.5">
          <span className={`block h-1.5 rounded-full ${i <= current ? "bg-forest" : "bg-stone/50"}`} />
          <span className={`capitalize ${i <= current ? "font-medium" : "text-ink-muted"}`}>
            {s}
            {i === current && <span className="sr-only"> (current)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function OrderDetail({ order }: { order: OrderDetailData }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="lines-heading" className="rounded-sm border border-stone/60 bg-paper">
        <h2 id="lines-heading" className="px-5 pt-5 text-xl">Lines</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[680px] text-left text-sm">
            <thead className="border-y border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Product</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Lot</th>
                <th scope="col" className="px-5 py-2.5 font-medium">THC / CBD</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Units</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Unit price</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/40">
              {order.items.map((i) => {
                const s = (i.snapshot ?? {}) as Snapshot;
                return (
                  <tr key={i.id}>
                    <td className="px-5 py-3">
                      <span className="font-medium">{s.name}</span>
                      <br />
                      <span className="text-ink-muted">{s.producer} · Licence {s.producer_licence} · {s.size}</span>
                    </td>
                    <td className="px-5 py-3">{s.lot_number}</td>
                    <td className="px-5 py-3">{formatPct(s.thc_pct)} / {formatPct(s.cbd_pct)}</td>
                    <td className="px-5 py-3 text-right">{i.quantity_units.toLocaleString("en-CA")}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(i.unit_price_cents)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(i.line_total_cents)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone/60">
                <th scope="row" colSpan={5} className="px-5 py-3 text-right font-medium">Subtotal (CAD, before taxes and excise)</th>
                <td className="px-5 py-3 text-right font-medium">{formatMoney(order.subtotal_cents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="docs-heading" className="rounded-sm border border-stone/60 bg-paper p-5">
          <h2 id="docs-heading" className="text-xl">Documents</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={`/documents/po/${order.id}`} className="underline underline-offset-2">
                Purchase order {order.po_number} (PDF)
              </a>
            </li>
            <li>
              {order.invoice_path ? (
                <a href={`/documents/invoice/${order.id}`} className="underline underline-offset-2">Invoice (PDF)</a>
              ) : (
                <span className="text-ink-muted">Invoice: not issued yet</span>
              )}
            </li>
          </ul>
          {order.notes && (
            <>
              <h3 className="mt-5 text-sm font-semibold">Buyer notes</h3>
              <p className="mt-1 text-sm">{order.notes}</p>
            </>
          )}
        </section>

        <section aria-labelledby="history-heading" className="rounded-sm border border-stone/60 bg-paper p-5">
          <h2 id="history-heading" className="text-xl">History</h2>
          <ol className="mt-3 space-y-3 text-sm">
            {order.events.map((e) => (
              <li key={e.id} className="border-l-2 border-stone pl-3">
                <p><StatusBadge status={e.to_status} /></p>
                <p className="mt-1 text-ink-muted">{formatDateTime(e.created_at)} · {e.actor_name ?? "System"}</p>
                {e.note && <p className="mt-1">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export const ORDER_SELECT =
  "id, po_number, status, created_at, notes, subtotal_cents, invoice_path, company_id, items:order_items(id, snapshot, quantity_units, unit_price_cents, line_total_cents), events:order_events(id, from_status, to_status, actor_name, note, created_at)";
