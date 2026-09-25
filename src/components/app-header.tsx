import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Wordmark } from "./wordmark";
import { NavLinks } from "./nav-links";

export function AppHeader({
  home,
  nav,
  userName,
  companyName,
  badge,
}: {
  home: string;
  nav: { href: string; label: string }[];
  userName: string;
  companyName?: string | null;
  badge?: string;
}) {
  return (
    <header className="border-b border-stone/60 bg-paper">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3">
        <div className="flex items-center gap-3">
          <Wordmark href={home} />
          {badge && (
            <span className="rounded-sm bg-cedar px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-paper">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ink-muted sm:inline">
            {userName}
            {companyName ? ` · ${companyName}` : ""}
          </span>
          <Link href="/account" className="underline-offset-4 hover:underline">
            Account
          </Link>
          <form action={signOut}>
            <button type="submit" className="underline-offset-4 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav aria-label="Main" className="border-t border-stone/40">
        <NavLinks items={nav} />
      </nav>
    </header>
  );
}
