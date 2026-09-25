import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-forest text-fog">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-serif text-2xl">
            Canna<span className="italic">Dry</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fog/80">
            Wholesale cannabis for Health Canada licence holders only. Products and prices are
            visible to verified accounts.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:underline" href="/how-it-works">How it works</Link></li>
            <li><Link className="hover:underline" href="/about">About</Link></li>
            <li><Link className="hover:underline" href="/contact">Contact</Link></li>
            <li><Link className="hover:underline" href="/request-access">Request access</Link></li>
          </ul>
        </nav>
        <ul className="space-y-2 text-sm">
          <li><Link className="hover:underline" href="/privacy">Privacy policy</Link></li>
          <li><Link className="hover:underline" href="/terms">Terms of use</Link></li>
          <li><Link className="hover:underline" href="/login">Sign in</Link></li>
        </ul>
      </div>
      <div className="border-t border-fog/15">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-fog/75 md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. Health Canada licence no. {site.licenceNumber}.
          </p>
          <p>For licensed businesses in Canada. {site.minimumAge}+ only.</p>
        </div>
      </div>
    </footer>
  );
}
