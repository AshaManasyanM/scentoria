import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "hy", "es"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Do not locale-prefix Shopify checkout paths (and do not bounce them —
  // Shopify may redirect back to the brand domain and that caused a loop).
  if (pathname.startsWith("/cart/c/") || pathname.startsWith("/checkouts/")) {
    return NextResponse.next();
  }

  const matched = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (matched) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", matched);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
