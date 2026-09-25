import type { Tables } from "@/lib/supabase/database.types";

export type CatalogueRow = Tables<"catalogue">;

export type CatalogueFilters = {
  q?: string;
  category?: string;
  producer?: string;
  size?: string;
  thc_min?: number;
  thc_max?: number;
  cbd_min?: number;
  cbd_max?: number;
  price_max?: number; // dollars per unit
  moq_max?: number; // units
  in_stock?: boolean;
  sort?: string;
};

export const SORTS = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
  { value: "thc_desc", label: "THC, high to low" },
  { value: "cbd_desc", label: "CBD, high to low" },
  { value: "newest", label: "Newest" },
] as const;

function num(v: unknown) {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseFilters(params: Record<string, string | string[] | undefined>): CatalogueFilters {
  const s = (k: string) => (typeof params[k] === "string" && params[k] ? (params[k] as string).trim() : undefined);
  return {
    q: s("q")?.slice(0, 80),
    category: s("category"),
    producer: s("producer"),
    size: s("size"),
    thc_min: num(params.thc_min),
    thc_max: num(params.thc_max),
    cbd_min: num(params.cbd_min),
    cbd_max: num(params.cbd_max),
    price_max: num(params.price_max),
    moq_max: num(params.moq_max),
    in_stock: params.in_stock === "1",
    sort: SORTS.some((x) => x.value === s("sort")) ? s("sort") : "name",
  };
}

/** Case price in cents. */
export const casePrice = (row: Pick<CatalogueRow, "price_per_unit_cents" | "units_per_case">) =>
  (row.price_per_unit_cents ?? 0) * (row.units_per_case ?? 1);
