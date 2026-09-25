export const AGE_COOKIE = "cd_age_ok";
export const AGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Only allow same-site relative paths as a redirect target. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
