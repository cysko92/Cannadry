const styles: Record<string, string> = {
  pending: "bg-mist text-cedar border-cedar/40",
  approved: "bg-success-tint text-forest border-moss",
  rejected: "bg-danger-tint text-danger border-danger/30",
  suspended: "bg-danger-tint text-danger border-danger/30",
  draft: "bg-mist text-ink-muted border-stone",
  published: "bg-success-tint text-forest border-moss",
  archived: "bg-mist text-ink-muted border-stone",
  submitted: "bg-mist text-cedar border-cedar/40",
  accepted: "bg-moss-tint text-forest border-moss",
  shipped: "bg-moss-tint text-forest border-moss",
  delivered: "bg-success-tint text-forest border-moss",
  cancelled: "bg-mist text-ink-muted border-stone",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
