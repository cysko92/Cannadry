import Link from "next/link";
import type { CatalogueRow } from "@/lib/catalogue";
import { formatMoney, formatRange } from "@/lib/format";
import { ProductTile } from "./product-tile";

export function ProductCard({ p }: { p: CatalogueRow }) {
  const stock = p.stock_units ?? 0;
  const low = stock > 0 && stock < (p.min_order_units ?? 1) * 2;
  return (
    <article className="group relative flex w-full flex-col rounded-sm border border-stone/60 bg-paper p-3 transition-colors hover:border-forest">
      <ProductTile category={p.category_name ?? ""} slug={p.category_slug ?? ""} size={p.size_label ?? ""} />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <h3 className="text-lg leading-snug">
          <Link href={`/shop/products/${p.id}`} className="after:absolute after:inset-0 group-hover:underline">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          {p.producer_name} · Licence {p.producer_licence}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{p.format}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-muted">THC</dt>
          <dd>{formatRange(p.thc_min, p.thc_max)}</dd>
          <dt className="text-ink-muted">CBD</dt>
          <dd>{formatRange(p.cbd_min, p.cbd_max)}</dd>
          <dt className="text-ink-muted">Case</dt>
          <dd>{p.units_per_case} units</dd>
          <dt className="text-ink-muted">Minimum</dt>
          <dd>{p.min_order_units} units</dd>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p>
            <span className="text-lg font-medium">{formatMoney(p.price_per_unit_cents)}</span>
            <span className="text-sm text-ink-muted"> / unit</span>
          </p>
          <p className={`text-xs font-medium ${stock === 0 ? "text-danger" : low ? "text-cedar" : "text-moss-deep"}`}>
            {stock === 0 ? "Out of stock" : low ? "Low stock" : "In stock"}
          </p>
        </div>
      </div>
    </article>
  );
}
