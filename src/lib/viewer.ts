import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user with their profile and company, or null. Cached per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, company:companies(*)")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile, company: profile?.company ?? null };
});

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

/** Where a signed-in user should land. */
export function homeFor(viewer: Viewer): string {
  if (viewer.profile?.is_admin) return "/admin";
  if (viewer.company?.status === "approved") return "/shop";
  return "/pending";
}

/** Approved buyer company (or CannaDry staff previewing the shop). */
export async function requireBuyer(next = "/shop") {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.profile?.is_admin) return viewer;
  if (viewer.company?.status !== "approved") redirect("/pending");
  return viewer;
}

export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (!viewer.profile?.is_admin) notFound();
  return viewer;
}
