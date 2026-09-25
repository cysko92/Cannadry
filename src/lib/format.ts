const TZ = "America/Vancouver";

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: TZ }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(
    new Date(value),
  );
}

export function formatMoney(cents: number | bigint | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(cents) / 100);
}

export function formatPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Number(value).toFixed(1)}%`;
}

export function formatRange(min: number | null | undefined, max: number | null | undefined) {
  if (min == null && max == null) return "—";
  if (min == null || max == null || Number(min) === Number(max)) return formatPct(min ?? max);
  return `${Number(min).toFixed(1)}–${Number(max).toFixed(1)}%`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString("en-CA")} ${n === 1 ? one : many}`;
}
