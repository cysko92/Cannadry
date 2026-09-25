import type { Metadata } from "next";
import { ActionForm, type FieldSpec } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { saveCategory } from "../catalogue-actions";

export const metadata: Metadata = { title: "Categories" };

const fields = (c?: Tables<"categories">): FieldSpec[] => [
  { name: "id", label: "", type: "hidden", defaultValue: c?.id ?? "" },
  { name: "name", label: "Name", defaultValue: c?.name },
  { name: "slug", label: "URL slug", hint: "Lowercase, e.g. pre-rolls", defaultValue: c?.slug },
  { name: "sort_order", label: "Sort order", type: "number", min: 0, step: "1", defaultValue: c?.sort_order ?? 0 },
  { name: "active", label: "Active", type: "checkbox", defaultValue: c ? c.active : true },
];

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl">Categories</h1>
      <ul className="mt-8 space-y-3">
        {(categories ?? []).map((c) => (
          <li key={c.id}>
            <details className="rounded-sm border border-stone/60 bg-paper">
              <summary className="flex cursor-pointer justify-between gap-2 px-5 py-4">
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-ink-muted">/{c.slug} · order {c.sort_order} · {c.active ? "Active" : "Hidden"}</span>
              </summary>
              <div className="border-t border-stone/50 p-5">
                <ActionForm action={saveCategory} fields={fields(c)} submitLabel="Save category" />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <section aria-labelledby="new-cat" className="mt-10 rounded-sm border border-stone/60 bg-paper p-5">
        <h2 id="new-cat" className="text-xl">Add a category</h2>
        <div className="mt-4">
          <ActionForm action={saveCategory} fields={fields()} submitLabel="Add category" />
        </div>
      </section>
    </div>
  );
}
