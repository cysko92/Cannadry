import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { DecisionForm } from "./decision-form";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyPage({ params }: PageProps<"/admin/companies/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  if (!company) notFound();

  const [{ data: docs }, { data: users }, { data: audit }] = await Promise.all([
    supabase.from("licence_documents").select("*").eq("company_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, phone, company_role, created_at").eq("company_id", id),
    supabase
      .from("audit_log")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Short-lived links to the private licence documents.
  const docLinks = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data } = await supabase.storage.from("licences").createSignedUrl(d.storage_path, 300);
      return { ...d, url: data?.signedUrl };
    }),
  );

  const facts: [string, string | null][] = [
    ["Licence type", company.licence_type],
    ["Licence number", company.licence_number],
    ["Province", company.province],
    ["Site address", company.address],
    ["Contact", company.contact_name],
    ["Email", company.contact_email],
    ["Phone", company.contact_phone],
    ["Submitted", formatDateTime(company.created_at)],
    ["Last review", company.reviewed_at ? formatDateTime(company.reviewed_at) : null],
    ["Review note", company.review_note],
  ];

  return (
    <div className="container-page py-10">
      <Link href="/admin/companies" className="text-sm underline underline-offset-2">
        ← All companies
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl">{company.legal_name}</h1>
        <StatusBadge status={company.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-8">
          <section aria-labelledby="details" className="rounded-sm border border-stone/60 bg-paper p-6">
            <h2 id="details" className="text-xl">Details</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
              {facts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd>{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="docs" className="rounded-sm border border-stone/60 bg-paper p-6">
            <h2 id="docs" className="text-xl">Licence documents</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {docLinks.map((d) => (
                <li key={d.id} className="flex flex-wrap justify-between gap-2">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      {d.file_name}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span>{d.file_name} (unavailable)</span>
                  )}
                  <span className="text-ink-muted">{formatDateTime(d.uploaded_at)}</span>
                </li>
              ))}
              {!docLinks.length && <li className="text-ink-muted">No documents.</li>}
            </ul>
          </section>

          <section aria-labelledby="users" className="rounded-sm border border-stone/60 bg-paper p-6">
            <h2 id="users" className="text-xl">Users</h2>
            <ul className="mt-4 divide-y divide-stone/40 text-sm">
              {(users ?? []).map((u) => (
                <li key={u.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    {u.full_name} <span className="text-ink-muted">· {u.email}</span>
                  </span>
                  <span className="capitalize text-ink-muted">{u.company_role}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="decision" className="rounded-sm border border-stone/60 bg-paper p-6">
            <h2 id="decision" className="text-xl">Decision</h2>
            {company.status === "pending" && (
              <p className="mt-2 text-sm text-ink-muted">
                Confirm the licence number, holder name and licence class on Health Canada&rsquo;s list
                of licensed cultivators, processors and sellers before approving.
              </p>
            )}
            <div className="mt-4">
              <DecisionForm companyId={company.id} status={company.status} />
            </div>
          </section>

          <section aria-labelledby="history" className="rounded-sm border border-stone/60 bg-paper p-6">
            <h2 id="history" className="text-xl">History</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {(audit ?? []).map((a) => (
                <li key={a.id} className="border-l-2 border-stone pl-3">
                  <p className="font-medium">{a.action}</p>
                  <p className="text-ink-muted">
                    {formatDateTime(a.created_at)} · {a.actor_name ?? "System"}
                  </p>
                  {typeof a.data === "object" && a.data && "note" in a.data && a.data.note ? (
                    <p className="mt-1">{String(a.data.note)}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
