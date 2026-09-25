import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/button";
import { signOut } from "@/app/auth/actions";
import { getViewer } from "@/lib/viewer";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Account status", robots: { index: false } };

const copy = {
  pending: {
    title: "Your request is under review.",
    body: "We are verifying your licence. You will receive an email when your account is approved. Products and prices become visible after approval.",
  },
  rejected: {
    title: "Your request was not approved.",
    body: "We could not verify this licence for a trade account.",
  },
  suspended: {
    title: "Your account is suspended.",
    body: "Access to the catalogue and orders is paused for your company.",
  },
} as const;

export default async function PendingPage({ searchParams }: PageProps<"/pending">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile?.is_admin) redirect("/admin");
  const status = viewer.company?.status;
  if (status === "approved") redirect("/shop");
  const params = await searchParams;
  const c = copy[status ?? "pending"];

  return (
    <div className="container-page py-20">
      <div className="max-w-2xl">
        {params.submitted && (
          <p role="status" className="mb-8 rounded-sm border border-moss bg-success-tint px-4 py-3 text-sm">
            Thank you. Your access request was submitted.
          </p>
        )}
        <p className="eyebrow">{viewer.company?.legal_name}</p>
        <h1 className="mt-3 text-4xl">{c.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{c.body}</p>
        {status !== "pending" && viewer.company?.review_note && (
          <p className="mt-4 border-l-2 border-cedar pl-4">Reason: {viewer.company.review_note}</p>
        )}
        <p className="mt-8 text-sm text-ink-muted">
          Questions? Email{" "}
          <a href={`mailto:${site.email}`} className="underline underline-offset-2">
            {site.email}
          </a>
          .
        </p>
        <form action={signOut} className="mt-8">
          <Button variant="secondary" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
