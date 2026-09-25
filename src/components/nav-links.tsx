"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // Longest matching prefix wins so /admin does not stay active on /admin/orders.
  const active = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <ul className="container-page flex gap-6 overflow-x-auto text-sm">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={item.href === active ? "page" : undefined}
            className="block whitespace-nowrap border-b-2 border-transparent py-3 hover:border-stone aria-[current=page]:border-forest aria-[current=page]:font-medium"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
