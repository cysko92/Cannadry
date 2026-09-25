import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catalogue" };

// Placeholder until the catalogue is built (step 3).
export default function ShopHome() {
  return (
    <div className="container-page py-16">
      <h1 className="text-4xl">Catalogue</h1>
      <p className="mt-4 text-ink-muted">Your account is approved. The catalogue is being prepared.</p>
    </div>
  );
}
