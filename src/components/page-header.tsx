export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="border-b border-stone/50">
      <div className="container-page py-16 md:py-20">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">{intro}</p>}
      </div>
    </div>
  );
}
