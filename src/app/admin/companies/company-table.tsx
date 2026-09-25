import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

export function CompanyTable({ companies }: { companies: Tables<"companies">[] }) {
  if (!companies.length) {
    return <p className="rounded-sm border border-stone/60 bg-paper p-8 text-ink-muted">Nothing here.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-sm border border-stone/60 bg-paper">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-stone/60 text-xs uppercase tracking-wider text-ink-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Company</th>
            <th scope="col" className="px-4 py-3 font-medium">Licence</th>
            <th scope="col" className="px-4 py-3 font-medium">Province</th>
            <th scope="col" className="px-4 py-3 font-medium">Contact</th>
            <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone/40">
          {companies.map((c) => (
            <tr key={c.id} className="hover:bg-fog">
              <td className="px-4 py-3">
                <Link href={`/admin/companies/${c.id}`} className="font-medium underline-offset-2 hover:underline">
                  {c.legal_name}
                </Link>
              </td>
              <td className="px-4 py-3">
                {c.licence_type}
                <br />
                <span className="text-ink-muted">{c.licence_number}</span>
              </td>
              <td className="px-4 py-3">{c.province}</td>
              <td className="px-4 py-3">
                {c.contact_name}
                <br />
                <span className="text-ink-muted">{c.contact_email}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.created_at)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
