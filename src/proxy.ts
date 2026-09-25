import { NextResponse, type NextRequest } from "next/server";
import { AGE_COOKIE } from "@/lib/age-gate";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 19+ age gate: every page requires the confirmation cookie.
  if (pathname !== "/age-check" && !request.cookies.has(AGE_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/age-check";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
