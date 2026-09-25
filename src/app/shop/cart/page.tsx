import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireBuyer } from "@/lib/viewer";
import { removeCartItem, updateCartItem } from "./actions";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage({ searchParams }: PageProps<"/shop/cart">) {
  const params = await searchParams;
  const viewer = await requireBuyer("/shop/cart");
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("cart_items")
    .select(
      "id, quantity_units, lot:product_lots(id, lot_number, stock_units, active, coa_path, product:products(id, name, format, size_label, units_per_case, min_order_units, price_per_unit_cents, status, producer:producers(name, licence_number)))",
    )
    .eq("user_id", viewer.user.id)
    .order("created_at");

  const rows = (items ?? []).map((i) => {
    const lot = i.lot!;
    const p = lot.product!;
    const problems: string[] = [];
    if (p.status !== "published" || !lot.active || !lot.coa_path) problems.push("No longer available.");
    if (i.quantity_units < p.min_order_units) problems.push(`Minimum order is ${p.min_order_units} units.`);
    if (i.quantity_units > lot.stock_units) problems.push(`Only ${lot.stock_units} units in stock.`);
    return { ...i, lot, p, cases: Math.round(i.quantity_units / p.units_per_case), total: i.quantity_units * p.price_per_unit_cents, problems };
  });
  const subtotal = rows.reduce((s, r) => s + r.total, 0);
  const blocked = rows.some((r) => r.problems.length);

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl">Cart</h1>
      {params.reordered !== undefined && (
        <p role="status" className="mt-6 rounded-sm border border-moss bg-success-tint px-4 py-3 text-sm">
          {params.reordered} line(s) added from your previous order.
          {Number(params.skipped) > 0 && ` ${params.skipped} line(s) are no longer available and were skipped.`}
        </p>
      )}
      {!rows.length ? (
        <div className="mt-8 rounded-sm border border-stone/60 bg-paper p-8">
          <p className="text-ink-muted">Your cart is empty.</p>
          <Link href="/shop" className="mt-4 inline-block underline underline-offset-2">Browse the catalogue</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="items-heading">
            <h2 id="items-heading" className="sr-only">Items</h2>
            <ul className="divide-y divide-stone/50 rounded-sm border border-stone/60 bg-paper">
              {rows.map((r) => (
                <li key={r.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <Link href={`/shop/products/${r.p.id}`} className="font-serif text-xl underline-offset-2 hover:underline">{r.p.name}</Link>
                    <p className="mt-1 text-sm text-ink-muted">
                      {r.p.producer?.name} · Licence {r.p.producer?.licence_number} · Lot {r.lot.lot_number}
                    </p>
                    <p className="text-sm text-ink-muted">{r.p.format} · {r.p.size_label} · {r.p.units_per_case} units per case</p>
                    {r.problems.map((m) => <p key={m} className="mt-2 text-sm text-danger">{m}</p>)}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <form action={updateCartItem} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <label className="text-xs text-ink-muted">
                        Cases
                        <input name="cases" type="number" min={0} step={1} defaultValue={r.cases} className="mt-1 block w-20 rounded-sm border border-stone bg-paper px-2 py-1.5 text-sm text-forest" />
                      </label>
                      <button type="submit" className="rounded-sm border border-forest px-3 py-1.5 text-sm">Update<span className="sr-only"> {r.p.name}</span></button>
                    </form>
                    <p className="text-sm">{r.quantity_units} units × {formatMoney(r.p.price_per_unit_cents)}</p>
                    <p className="font-medium">{formatMoney(r.total)}</p>
                    <form action={removeCartItem}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-sm underline underline-offset-2">Remove<span className="sr-only"> {r.p.name}</span></button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <aside aria-labelledby="summary-heading" className="self-start rounded-sm border border-stone/60 bg-paper p-5">
            <h2 id="summary-heading" className="text-xl">Purchase order</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Lines</dt><dd>{rows.length}</dd></div>
              <div className="flex justify-between text-base font-medium"><dt>Subtotal (CAD)</dt><dd>{formatMoney(subtotal)}</dd></div>
            </dl>
            <p className="mt-1 text-xs text-ink-muted">Taxes and excise duty are added on the invoice.</p>
            {blocked && <p className="mt-4 text-sm text-danger" role="alert">Fix the highlighted lines before submitting.</p>}
            <div className="mt-5">
              <CheckoutForm disabled={blocked || !!viewer.profile?.is_admin} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
