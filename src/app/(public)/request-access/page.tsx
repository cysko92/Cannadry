import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Request access" };

export default function RequestAccessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Request access"
        title="Open a trade account."
        intro="For Health Canada licence holders only. We verify every licence before an account can see products or prices."
      />
      <div className="container-page grid gap-16 py-14 lg:grid-cols-[2fr_1fr]">
        <RequestForm />
        <aside className="space-y-6 text-sm leading-relaxed text-ink-muted lg:pt-2">
          <div className="border-t border-stone pt-5">
            <h2 className="font-sans text-sm font-semibold text-forest">What happens next</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4">
              <li>Confirm your email address.</li>
              <li>We check your licence against Health Canada records.</li>
              <li>You receive an email when your account is approved.</li>
            </ol>
          </div>
          <div className="border-t border-stone pt-5">
            <h2 className="font-sans text-sm font-semibold text-forest">Your information</h2>
            <p className="mt-3">
              Stored in Canada and used only to verify your licence and process orders. See our
              privacy policy.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
