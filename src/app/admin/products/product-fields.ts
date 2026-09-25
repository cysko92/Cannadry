import type { FieldSpec } from "@/components/action-form";
import type { Tables } from "@/lib/supabase/database.types";

export function productFields(
  producers: { id: string; name: string }[],
  categories: { id: string; name: string }[],
  p?: Tables<"products">,
): FieldSpec[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: p?.id ?? "" },
    { name: "name", label: "Product name", defaultValue: p?.name, wide: true },
    { name: "producer_id", label: "Licence holder (producer)", type: "select", options: producers.map((x) => ({ value: x.id, label: x.name })), defaultValue: p?.producer_id },
    { name: "category_id", label: "Category", type: "select", options: categories.map((x) => ({ value: x.id, label: x.name })), defaultValue: p?.category_id },
    { name: "format", label: "Format", hint: "e.g. Dried flower, whole bud · Pre-roll, 0.5 g × 3", defaultValue: p?.format },
    { name: "size_label", label: "Size", hint: "e.g. 3.5 g · 1 kg · 10 mg THC", defaultValue: p?.size_label },
    { name: "units_per_case", label: "Units per case", type: "number", min: 1, step: "1", defaultValue: p?.units_per_case ?? 24 },
    { name: "price", label: "Price per unit (CAD)", type: "number", min: 0, step: "0.01", defaultValue: p ? (p.price_per_unit_cents / 100).toFixed(2) : "" },
    { name: "min_order_units", label: "Minimum order (units)", type: "number", min: 1, step: "1", defaultValue: p?.min_order_units ?? 24 },
    { name: "lead_time_days", label: "Lead time (business days)", type: "number", min: 0, step: "1", defaultValue: p?.lead_time_days ?? 3 },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      optional: true,
      hint: "Facts only: cultivar type, growing method, packaging. No health or therapeutic claims, no effects.",
      defaultValue: p?.description,
    },
  ];
}
