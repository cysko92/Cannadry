import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Producer" };

export default async function ProducerPage({ params }: PageProps<"/shop/producers/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: producer } = await supabase.from("producers").select("*").eq("id", id).maybeSingle();
  if (!producer) notFound();
  const { data: products } = await supabase
    .from("catalogue")
    .select("*")
    .eq("producer_id", id)
    .eq("status", "published")
    .order("name");

  return (
    <div className="container-page py-10">
      <Link href="/shop" className="text-sm underline underline-offset-2">← Catalogue</Link>
      <div className="mt-6 grid gap-8 border-b border-stone/60 pb-10 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="eyebrow">Licence holder</p>
          <h1 className="mt-2 text-4xl">{producer.name}</h1>
          {producer.description && <p className="mt-4 max-w-2xl leading-relaxed">{producer.description}</p>}
        </div>
        <dl className="self-end text-sm">
          <div className="grid grid-cols-[8rem_1fr] gap-2 border-t border-stone/60 py-2">
            <dt className="text-ink-muted">Licence no.</dt><dd>{producer.licence_number}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-2 border-t border-stone/60 py-2">
            <dt className="text-ink-muted">Location</dt>
            <dd>{[producer.city, producer.province].filter(Boolean).join(", ") || "—"}</dd>
          </div>
        </dl>
      </div>
      <h2 className="mt-10 text-2xl">Products</h2>
      {products?.length ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => <li key={p.id} className="flex"><ProductCard p={p} /></li>)}
        </ul>
      ) : (
        <p className="mt-4 text-ink-muted">No products available right now.</p>
      )}
    </div>
  );
}
