/**
 * Neutral visual for a product card. No product photography: a stone/moss texture block
 * with the category and size, consistent with the brand's no-lifestyle-imagery rule.
 */
const tones: Record<string, string> = {
  flower: "from-moss-tint to-mist",
  "pre-rolls": "from-mist to-moss-tint",
  extracts: "from-[#ece4d8] to-mist",
  vapes: "from-mist to-[#e6e3dc]",
  edibles: "from-[#efe7dc] to-mist",
  bulk: "from-[#dfe3d9] to-[#ece9e2]",
};

export function ProductTile({ category, slug, size }: { category: string; slug: string; size: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-sm bg-gradient-to-br p-4 ${tones[slug] ?? tones.flower}`}
    >
      <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
        <path d="M0 110 C40 96 70 104 100 92 C130 80 160 96 200 86 L200 150 L0 150 Z" fill="#b8b2a7" fillOpacity="0.35" />
        <path d="M0 128 C50 118 90 126 130 116 C160 110 180 118 200 114 L200 150 L0 150 Z" fill="#7a8b6f" fillOpacity="0.35" />
      </svg>
      <span className="relative text-xs font-semibold uppercase tracking-[0.14em] text-cedar">{category}</span>
      <span className="relative font-serif text-2xl text-forest">{size}</span>
    </div>
  );
}
