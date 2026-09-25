import Link from "next/link";

/** Text wordmark placeholder until a logo exists. Swap the inner markup for an <svg> later. */
export function Wordmark({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`font-serif text-2xl leading-none tracking-tight text-forest ${className}`}
      aria-label="CannaDry home"
    >
      Canna<span className="italic">Dry</span>
    </Link>
  );
}
