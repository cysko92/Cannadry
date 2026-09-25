import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = (await getViewer())!;
  const company = viewer.company;
  const supabase = await createClient();
  const { data: colleagues } = company
    ? await supabase.from("profiles").select("id, full_name, email, company_role").eq("company_id", company.id)
    : { data: [] };

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
      <section aria-labelledby="you">
        <h1 id="you" className="text-3xl">Your details</h1>
        <p className="mt-2 text-sm text-ink-muted">Signed in as {viewer.user.email}.</p>
        <div className="mt-6 max-w-md">
          <ProfileForm fullName={viewer.profile?.full_name ?? ""} phone={viewer.profile?.phone ?? ""} />
        </div>
        <p className="mt-6 text-sm">
          <Link href="/forgot-password" className="underline underline-offset-2">
            Change password
          </Link>
        </p>
      </section>

      {company && (
        <section aria-labelledby="company" className="rounded-sm border border-stone/60 bg-paper p-6">
          <div className="flex items-center gap-3">
            <h2 id="company" className="text-2xl">{company.legal_name}</h2>
            <StatusBadge status={company.status} />
          </div>
          <dl className="mt-4 grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
            <dt className="text-ink-muted">Licence</dt>
            <dd>{company.licence_type} · {company.licence_number}</dd>
            <dt className="text-ink-muted">Province</dt>
            <dd>{company.province}</dd>
            <dt className="text-ink-muted">Address</dt>
            <dd>{company.address ?? "—"}</dd>
          </dl>
          <p className="mt-4 text-sm text-ink-muted">
            To change licence or company details, contact CannaDry. Changes are re-verified.
          </p>
          <h3 className="mt-8 text-lg">Users</h3>
          <ul className="mt-2 divide-y divide-stone/40 text-sm">
            {(colleagues ?? []).map((c) => (
              <li key={c.id} className="flex justify-between gap-2 py-2">
                <span>{c.full_name} <span className="text-ink-muted">· {c.email}</span></span>
                <span className="capitalize text-ink-muted">{c.company_role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
