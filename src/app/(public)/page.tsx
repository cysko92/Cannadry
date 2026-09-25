import { ButtonLink } from "@/components/button";
import { Ridgeline } from "@/components/ridgeline";

const whoWeServe = [
  {
    title: "Cultivators",
    body: "Source flower, trim and bulk to fill gaps in your own supply or round out a product line.",
  },
  {
    title: "Processors",
    body: "Buy input material and finished goods by the case, with lot data and a COA for each lot.",
  },
  {
    title: "Other licence holders",
    body: "Any Health Canada licence class that permits the purchase can apply. We confirm eligibility for each account.",
  },
];

const standards = [
  {
    title: "Verified trade only",
    body: "Every account is checked against its Health Canada licence before it can see a product or a price.",
  },
  {
    title: "A COA for every lot",
    body: "Each listing names its licence holder and links the certificate of analysis for the lot you are buying.",
  },
  {
    title: "Facts, not claims",
    body: "Cannabinoid content, terpenes, format, case size, dates. Nothing else.",
  },
  {
    title: "Purchase orders and records",
    body: "Orders are placed as purchase orders. Every order, status change and user action is recorded and exportable.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-page pb-6 pt-20 md:pt-28">
          <p className="eyebrow">Wholesale · British Columbia</p>
          <h1 className="mt-4 max-w-4xl text-5xl leading-[1.05] md:text-7xl">
            Licensed cannabis, sold wholesale to licence holders.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            CannaDry supplies Health Canada licensed producers and processors. One supplier, verified
            accounts, clear lot data and a certificate of analysis with every listing.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/request-access">Request access</ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary">
              How it works
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            Products and prices are only visible after your licence is verified.
          </p>
        </div>
        <Ridgeline className="mt-8" />
      </section>

      <section aria-labelledby="who" className="bg-forest text-fog">
        <div className="container-page py-20">
          <p className="eyebrow !text-moss-tint">Who we serve</p>
          <h2 id="who" className="mt-3 max-w-2xl text-3xl md:text-4xl">
            Built for licence holders buying from a licence holder.
          </h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {whoWeServe.map((item) => (
              <li key={item.title} className="border-t border-fog/25 pt-6">
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-fog/80">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="standards">
        <div className="container-page py-20">
          <p className="eyebrow">How we trade</p>
          <h2 id="standards" className="mt-3 max-w-2xl text-3xl md:text-4xl">
            Calm, documented, compliant.
          </h2>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-sm border border-stone/60 bg-stone/60 md:grid-cols-2">
            {standards.map((item) => (
              <li key={item.title} className="bg-paper p-8">
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="cta" className="border-t border-stone/50 bg-mist">
        <div className="container-page flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
          <div>
            <h2 id="cta" className="text-3xl">Open a trade account</h2>
            <p className="mt-3 max-w-xl text-ink-muted">
              Send your licence details. We verify them and let you know by email.
            </p>
          </div>
          <ButtonLink href="/request-access">Request access</ButtonLink>
        </div>
      </section>
    </>
  );
}
