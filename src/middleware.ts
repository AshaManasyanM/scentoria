import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "hy", "es"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  // Keep Shopify checkout paths (/cart/c/..., /checkouts/...) out of locale redirects.
  matcher: ["/((?!_next|api|cart/c|checkouts|favicon.ico|.*\\..*).*)"],
};
