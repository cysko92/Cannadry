import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" intro="Last updated: draft, pending legal review." />
      <article className="container-page prose-page max-w-3xl py-12">
        <p className="rounded-sm border border-cedar/40 bg-paper p-4 text-sm">
          Draft for review by counsel. This text is a starting point and is not legal advice.
        </p>

        <h2>Who we are</h2>
        <p>
          {site.legalName} (&ldquo;CannaDry&rdquo;) operates this website and trade platform. We
          are responsible for personal information under our control, and we follow British
          Columbia&rsquo;s Personal Information Protection Act (PIPA) and, where it applies, the
          federal Personal Information Protection and Electronic Documents Act (PIPEDA).
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Business contact details: name, role, work email, work phone.</li>
          <li>Company and licence information, including a copy of your Health Canada licence.</li>
          <li>Account activity: orders, status changes, sign-in times and the user who acted.</li>
          <li>Technical data needed to run the site securely, such as IP address and browser type.</li>
          <li>A cookie recording that you confirmed you are {site.minimumAge} or older, and session cookies when you sign in.</li>
        </ul>

        <h2>Why we collect it</h2>
        <ul>
          <li>To verify that your business holds a valid licence before granting access.</li>
          <li>To process purchase orders, ship product and issue invoices.</li>
          <li>To keep the records required of a licence holder under the Cannabis Act and its regulations.</li>
          <li>To secure the platform and prevent misuse.</li>
        </ul>
        <p>We do not sell personal information and we do not use it for advertising.</p>

        <h2>Where it is stored</h2>
        <p>
          Personal information and documents are stored on servers located in Canada. Service
          providers who process data on our behalf are bound by contract to protect it.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep order and account records for as long as the law requires, and other information
          only as long as needed for the purposes above.
        </p>

        <h2>Your rights</h2>
        <p>
          You may ask to access or correct your personal information, or withdraw consent where
          withdrawal is permitted by law. Contact our privacy officer at{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>. If you are not satisfied with our
          response, you may contact the Office of the Information and Privacy Commissioner for
          British Columbia.
        </p>
      </article>
    </>
  );
}
