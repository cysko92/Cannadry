import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of use" intro="Last updated: draft, pending legal review." />
      <article className="container-page prose-page max-w-3xl py-12">
        <p className="rounded-sm border border-cedar/40 bg-paper p-4 text-sm">
          Draft for review by counsel. This text is a starting point and is not legal advice.
        </p>

        <h2>1. Who may use CannaDry</h2>
        <p>
          The trade platform is for businesses that hold a valid Health Canada licence under the
          Cannabis Act permitting them to purchase cannabis from another licence holder. Users must
          be {site.minimumAge} or older and authorised to act for their business.
        </p>

        <h2>2. Account verification</h2>
        <p>
          We verify each licence before approving an account. We may refuse, suspend or close an
          account at any time, including if a licence is suspended, revoked or expires.
        </p>

        <h2>3. Orders</h2>
        <p>
          Orders are submitted as purchase orders and are binding only once accepted by CannaDry.
          Prices, stock and lead times shown are subject to change until acceptance. Invoices are
          issued after acceptance; there is no online payment.
        </p>

        <h2>4. Your obligations</h2>
        <ul>
          <li>Buy only what your licence permits, and keep your licence information up to date.</li>
          <li>Keep your sign-in details confidential; you are responsible for activity on your account.</li>
          <li>Do not share product information, prices or documents with anyone who is not authorised to see them.</li>
        </ul>

        <h2>5. Product information</h2>
        <p>
          Product information is provided as factual specifications and certificates of analysis.
          CannaDry makes no health or therapeutic claims about any product.
        </p>

        <h2>6. Records</h2>
        <p>
          We keep records of orders and account activity, including dates and the users involved,
          as required by law and for audit purposes.
        </p>

        <h2>7. Governing law</h2>
        <p>
          These terms are governed by the laws of British Columbia and the federal laws of Canada
          that apply there.
        </p>
      </article>
    </>
  );
}
