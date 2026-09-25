import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";
import { CompanyTable } from "./company-table";

export const metadata: Metadata = { title: "Companies" };

const FILTERS = ["all", "approved", "pending", "suspended", "rejected"] as const;

export default async function CompaniesPage({ searchParams }: PageProps<"/admin/companies">) {
  const params = await searchParams;
  const status = FILTERS.find((f) => f === params.status) ?? "all";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const supabase = await createClient();
  let query = supabase.from("companies").select("*").order("legal_name");
  if (status !== "all") query = query.eq("status", status as Enums<"company_status">);
  if (q) {
    const term = `%${q.replace(/[%_,()]/g, " ")}%`;
    query = query.or(`legal_name.ilike.${term},licence_number.ilike.${term},contact_email.ilike.${term}`);
  }
  const { data } = await query;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl">Companies</h1>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-2 text-sm">
            {FILTERS.map((f) => (
              <li key={f}>
                <Link
                  href={f === "all" ? "/admin/companies" : `/admin/companies?status=${f}`}
                  aria-current={f === status ? "page" : undefined}
                  className="block rounded-sm border border-stone px-3 py-1.5 capitalize aria-[current=page]:border-forest aria-[current=page]:bg-forest aria-[current=page]:text-fog"
                >
                  {f}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form role="search" className="flex gap-2">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <label htmlFor="q" className="sr-only">Search companies</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name, licence no. or email"
            className="w-64 rounded-sm border border-stone bg-paper px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-sm border border-forest px-3 py-1.5 text-sm">
            Search
          </button>
        </form>
      </div>
      <div className="mt-6">
        <CompanyTable companies={data ?? []} />
      </div>
    </div>
  );
}
