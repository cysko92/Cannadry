import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Ridgeline } from "@/components/ridgeline";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

const commitments = [
  "Only verified Health Canada licence holders can see products or prices.",
  "Every product names its licence holder and carries a certificate of analysis.",
  "Product information is factual. No health or therapeutic claims, no lifestyle marketing.",
  "Orders, status changes and account actions are recorded with the date and the user.",
  "Personal information is stored in Canada and handled under BC PIPA and PIPEDA.",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A wholesale supplier with British Columbia roots."
        intro="CannaDry sells licensed cannabis to other licence holders across Canada. We keep the catalogue, the paperwork and the relationship in one place."
      />

      <section className="container-page grid gap-12 py-16 md:grid-cols-2">
        <div className="prose-page">
          <h2 className="!mt-0">What we do</h2>
          <p>
            CannaDry is the single seller on this platform. We list, price and ship every product
            ourselves, and we stand behind the data on each listing: licence holder, lot number,
            dates, cannabinoid content and certificate of analysis.
          </p>
          <p>
            Licensed producers and processors use CannaDry to source bulk and finished product with
            a clear purchase-order process and complete records.
          </p>
        </div>
        <div className="prose-page">
          <h2 className="!mt-0">Where we come from</h2>
          <p>
            We are based in British Columbia, where careful cultivation has a long history. That
            shapes how we work: steady, precise and accountable.
          </p>
          <p>
            CannaDry operates under Health Canada licence no. {site.licenceNumber}.
          </p>
        </div>
      </section>

      <Ridgeline />

      <section aria-labelledby="commitment" className="bg-forest text-fog">
        <div className="container-page py-16">
          <h2 id="commitment" className="text-3xl">Our compliance commitment</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {commitments.map((c) => (
              <li key={c} className="border-l-2 border-moss pl-4 leading-relaxed text-fog/90">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
