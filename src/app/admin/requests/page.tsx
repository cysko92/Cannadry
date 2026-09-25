import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CompanyTable } from "../companies/company-table";

export const metadata: Metadata = { title: "Access requests" };

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl">Access requests</h1>
      <p className="mt-2 text-ink-muted">
        Pending requests, oldest first. Check each licence against Health Canada records before approving.
      </p>
      <div className="mt-8">
        <CompanyTable companies={data ?? []} />
      </div>
    </div>
  );
}
