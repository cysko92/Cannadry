"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./wordmark";
import { buttonClass } from "./button";
import { publicNav } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  // The mobile menu is open only on the page where it was opened, so it closes after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <header className="border-b border-stone/50 bg-fog/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Wordmark />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="underline-offset-4 hover:underline aria-[current=page]:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm underline-offset-4 hover:underline">
            Sign in
          </Link>
          <Link href="/request-access" className={buttonClass("primary")}>
            Request access
          </Link>
        </div>

        <button
          type="button"
          className="-mr-2 p-2 text-sm font-medium md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-stone/50 md:hidden">
          <ul className="container-page flex flex-col py-4 text-base">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block py-2.5">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="block py-2.5">
                Sign in
              </Link>
            </li>
            <li className="pt-3">
              <Link href="/request-access" className={buttonClass("primary", "w-full")}>
                Request access
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
