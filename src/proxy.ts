import { NextResponse, type NextRequest } from "next/server";
import { AGE_COOKIE } from "@/lib/age-gate";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = ["/shop", "/account", "/admin", "/pending"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 19+ age gate: every page requires the confirmation cookie.
  if (pathname !== "/age-check" && !request.cookies.has(AGE_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/age-check";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const { response, userId } = await updateSession(request);

  // Optimistic check only. Pages re-check the user, company status and role on the server,
  // and row-level security enforces access in the database.
  if (!userId && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
