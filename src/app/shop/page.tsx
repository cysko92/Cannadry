import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SORTS, parseFilters } from "@/lib/catalogue";
import { plural } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catalogue" };

const input = "w-full rounded-sm border border-stone bg-paper px-2.5 py-1.5 text-sm";

export default async function CataloguePage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const f = parseFilters(params);
  const supabase = await createClient();

  let query = supabase.from("catalogue").select("*").eq("status", "published");
  if (f.q) query = query.ilike("name", `%${f.q.replace(/[%_]/g, "")}%`);
  if (f.category) query = query.eq("category_slug", f.category);
  if (f.producer) query = query.eq("producer_id", f.producer);
  if (f.size) query = query.eq("size_label", f.size);
  // Range filters match a product when any active lot falls inside the range.
  if (f.thc_min != null) query = query.gte("thc_max", f.thc_min);
  if (f.thc_max != null) query = query.lte("thc_min", f.thc_max);
  if (f.cbd_min != null) query = query.gte("cbd_max", f.cbd_min);
  if (f.cbd_max != null) query = query.lte("cbd_min", f.cbd_max);
  if (f.price_max != null) query = query.lte("price_per_unit_cents", Math.round(f.price_max * 100));
  if (f.moq_max != null) query = query.lte("min_order_units", f.moq_max);
  if (f.in_stock) query = query.gt("stock_units", 0);
  query =
    f.sort === "price_asc" ? query.order("price_per_unit_cents")
    : f.sort === "price_desc" ? query.order("price_per_unit_cents", { ascending: false })
    : f.sort === "thc_desc" ? query.order("thc_max", { ascending: false, nullsFirst: false })
    : f.sort === "cbd_desc" ? query.order("cbd_max", { ascending: false, nullsFirst: false })
    : f.sort === "newest" ? query.order("created_at", { ascending: false })
    : query.order("name");

  const [{ data: products }, { data: categories }, { data: producers }, { data: sizes }] = await Promise.all([
    query,
    supabase.from("categories").select("name, slug").eq("active", true).order("sort_order"),
    supabase.from("producers").select("id, name").eq("active", true).order("name"),
    supabase.from("catalogue").select("size_label").eq("status", "published").order("size_label"),
  ]);
  const sizeOptions = [...new Set((sizes ?? []).map((s) => s.size_label).filter(Boolean))] as string[];
  const active = Object.entries(params).some(([k, v]) => k !== "sort" && v);

  const categoryHref = (slug?: string) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (typeof v === "string" && v && k !== "category") sp.set(k, v);
    if (slug) sp.set("category", slug);
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Catalogue</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Wholesale prices in CAD, excluding taxes and excise. Each product lists its licence holder and a COA per lot.
          </p>
        </div>
      </div>

      <nav aria-label="Categories" className="mt-8 border-b border-stone/60">
        <ul className="-mb-px flex gap-6 overflow-x-auto text-sm">
          {[{ name: "All", slug: undefined }, ...(categories ?? [])].map((c) => (
            <li key={c.name}>
              <Link
                href={categoryHref(c.slug)}
                aria-current={f.category === c.slug ? "page" : undefined}
                className="block whitespace-nowrap border-b-2 border-transparent pb-3 hover:border-stone aria-[current=page]:border-forest aria-[current=page]:font-medium"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <form method="get" action="/shop" className="space-y-5 self-start rounded-sm border border-stone/60 bg-paper p-4" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="font-sans text-sm font-semibold uppercase tracking-wider">Filters</h2>
          {f.category && <input type="hidden" name="category" value={f.category} />}
          <div>
            <label htmlFor="q" className="text-sm font-medium">Search</label>
            <input id="q" name="q" defaultValue={f.q} className={`mt-1 ${input}`} placeholder="Product name" />
          </div>
          <div>
            <label htmlFor="producer" className="text-sm font-medium">Producer</label>
            <select id="producer" name="producer" defaultValue={f.producer ?? ""} className={`mt-1 ${input}`}>
              <option value="">All producers</option>
              {(producers ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">THC %</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-muted">Min<input name="thc_min" type="number" min={0} max={100} step="0.1" defaultValue={f.thc_min} className={input} /></label>
              <label className="text-xs text-ink-muted">Max<input name="thc_max" type="number" min={0} max={100} step="0.1" defaultValue={f.thc_max} className={input} /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">CBD %</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-muted">Min<input name="cbd_min" type="number" min={0} max={100} step="0.1" defaultValue={f.cbd_min} className={input} /></label>
              <label className="text-xs text-ink-muted">Max<input name="cbd_max" type="number" min={0} max={100} step="0.1" defaultValue={f.cbd_max} className={input} /></label>
            </div>
          </fieldset>
          <div>
            <label htmlFor="size" className="text-sm font-medium">Format / size</label>
            <select id="size" name="size" defaultValue={f.size ?? ""} className={`mt-1 ${input}`}>
              <option value="">All sizes</option>
              {sizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="price_max" className="text-sm font-medium">Max price per unit ($)</label>
            <input id="price_max" name="price_max" type="number" min={0} step="0.01" defaultValue={f.price_max} className={`mt-1 ${input}`} />
          </div>
          <div>
            <label htmlFor="moq_max" className="text-sm font-medium">Max minimum order (units)</label>
            <input id="moq_max" name="moq_max" type="number" min={0} step="1" defaultValue={f.moq_max} className={`mt-1 ${input}`} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="in_stock" value="1" defaultChecked={f.in_stock} className="h-4 w-4 accent-forest" />
            In stock only
          </label>
          <div>
            <label htmlFor="sort" className="text-sm font-medium">Sort by</label>
            <select id="sort" name="sort" defaultValue={f.sort} className={`mt-1 ${input}`}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-sm bg-forest px-4 py-2 text-sm font-medium text-fog hover:bg-forest-soft">Apply</button>
            {active && <Link href="/shop" className="text-sm underline underline-offset-2">Clear</Link>}
          </div>
        </form>

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">Products</h2>
          <p className="text-sm text-ink-muted" role="status">{plural(products?.length ?? 0, "product")}</p>
          {products?.length ? (
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => <li key={p.id} className="flex"><ProductCard p={p} /></li>)}
            </ul>
          ) : (
            <p className="mt-4 rounded-sm border border-stone/60 bg-paper p-8 text-ink-muted">
              No products match these filters.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
