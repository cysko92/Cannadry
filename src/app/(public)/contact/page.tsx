import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the CannaDry team."
        intro="Questions about access, orders or documents. We reply on business days."
      />
      <section className="container-page grid gap-8 py-16 md:grid-cols-3">
        <div className="border-t border-stone pt-6">
          <h2 className="text-xl">Email</h2>
          <p className="mt-2">
            <a className="underline underline-offset-4" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </p>
        </div>
        <div className="border-t border-stone pt-6">
          <h2 className="text-xl">Phone</h2>
          <p className="mt-2">
            <a className="underline underline-offset-4" href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
              {site.phone}
            </a>
          </p>
        </div>
        <div className="border-t border-stone pt-6">
          <h2 className="text-xl">Office</h2>
          <p className="mt-2">{site.address}</p>
        </div>
      </section>
      <section className="container-page pb-20">
        <p className="max-w-2xl text-ink-muted">
          Already have an account? Sign in and use the notes field on an order, or email us with
          your purchase order number.
        </p>
      </section>
    </>
  );
}
