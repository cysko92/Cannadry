import type { Metadata } from "next";
import { ActionForm, type FieldSpec } from "@/components/action-form";
import { PROVINCES } from "@/lib/licence";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { saveProducer } from "../catalogue-actions";

export const metadata: Metadata = { title: "Producers" };

const fields = (p?: Tables<"producers">): FieldSpec[] => [
  { name: "id", label: "", type: "hidden", defaultValue: p?.id ?? "" },
  { name: "name", label: "Licence holder name", defaultValue: p?.name },
  { name: "licence_number", label: "Health Canada licence number", defaultValue: p?.licence_number },
  { name: "city", label: "City", optional: true, defaultValue: p?.city },
  { name: "province", label: "Province", type: "select", options: PROVINCES.map((v) => ({ value: v, label: v })), defaultValue: p?.province ?? "British Columbia" },
  { name: "description", label: "Description", type: "textarea", optional: true, hint: "Facts only: cultivation method, location. No health claims.", defaultValue: p?.description },
  { name: "active", label: "Active (shown to buyers)", type: "checkbox", defaultValue: p ? p.active : true },
];

export default async function ProducersPage() {
  const supabase = await createClient();
  const [{ data: producers }, { data: counts }] = await Promise.all([
    supabase.from("producers").select("*").order("name"),
    supabase.from("products").select("producer_id"),
  ]);
  const productCount = (id: string) => (counts ?? []).filter((c) => c.producer_id === id).length;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl">Producers</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Licence holders whose products CannaDry sells. The name and licence number are shown on every product.
      </p>
      <ul className="mt-8 space-y-3">
        {(producers ?? []).map((p) => (
          <li key={p.id}>
            <details className="rounded-sm border border-stone/60 bg-paper">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-ink-muted">
                  Licence {p.licence_number} · {productCount(p.id)} products · {p.active ? "Active" : "Inactive"}
                </span>
              </summary>
              <div className="border-t border-stone/50 p-5">
                <ActionForm action={saveProducer} fields={fields(p)} submitLabel="Save producer" />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <section aria-labelledby="new-producer" className="mt-10 rounded-sm border border-stone/60 bg-paper p-5">
        <h2 id="new-producer" className="text-xl">Add a producer</h2>
        <div className="mt-4">
          <ActionForm action={saveProducer} fields={fields()} submitLabel="Add producer" />
        </div>
      </section>
    </div>
  );
}
