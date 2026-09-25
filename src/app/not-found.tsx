import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container-page flex flex-1 flex-col items-start justify-center py-24">
      <p className="font-serif text-2xl">
        Canna<span className="italic">Dry</span>
      </p>
      <h1 className="mt-8 text-4xl">Page not found</h1>
      <p className="mt-3 text-ink-muted">The page does not exist, or your account does not have access to it.</p>
      <Link href="/" className="mt-8 underline underline-offset-4">Go to the home page</Link>
    </main>
  );
}
