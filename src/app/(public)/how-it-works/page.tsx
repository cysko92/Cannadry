import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  {
    title: "Request access",
    body: "Submit your company's legal name, licence type and number, a contact person and a copy of your Health Canada licence.",
  },
  {
    title: "We verify your licence",
    body: "Our team checks your licence against Health Canada records and the document you uploaded. You receive an email when your account is approved.",
  },
  {
    title: "Browse and order",
    body: "Sign in to see the full catalogue with prices, stock, lot data and COAs. Add products to your cart and submit a purchase order.",
  },
  {
    title: "Confirmation, shipping and records",
    body: "We accept your purchase order, ship it and issue an invoice. Your order history, documents and status updates stay in your account.",
  },
];

const faqs = [
  {
    q: "Who can open an account?",
    a: "Businesses holding a Health Canada licence under the Cannabis Act that permits the purchase of cannabis from another licence holder. Individuals and consumers cannot open an account.",
  },
  {
    q: "Can I see products before I am approved?",
    a: "No. Products, prices and certificates of analysis are only visible to verified accounts.",
  },
  {
    q: "How is payment handled?",
    a: "Orders are placed as purchase orders. CannaDry issues an invoice after your order is accepted. There is no online payment.",
  },
  {
    q: "Is there a minimum order?",
    a: "Yes. Each product lists its minimum order and case size. The cart checks these before you submit.",
  },
  {
    q: "What records are kept?",
    a: "Every order, status change and account action is recorded with the date and the user. You can download your order history at any time.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="From licence check to delivered order."
        intro="Four steps. Every step is recorded."
      />

      <section aria-labelledby="steps-heading" className="container-page py-16">
        <h2 id="steps-heading" className="sr-only">
          Steps
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-sm border border-stone/60 bg-stone/60 md:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step.title} className="bg-paper p-8">
              <p className="font-serif text-4xl text-cedar" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading" className="border-t border-stone/50">
        <div className="container-page grid gap-10 py-16 md:grid-cols-[1fr_2fr]">
          <h2 id="faq-heading" className="text-3xl">
            Questions
          </h2>
          <dl className="divide-y divide-stone/60 border-y border-stone/60">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-2 leading-relaxed text-ink-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page pb-20">
        <ButtonLink href="/request-access">Request access</ButtonLink>
      </section>
    </>
  );
}
