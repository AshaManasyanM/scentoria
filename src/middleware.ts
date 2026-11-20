import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "hy", "es"] as const;

function shopifyCheckoutHost() {
  const candidates = [
    process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN,
    process.env.SHOPIFY_CHECKOUT_DOMAIN,
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    process.env.SHOPIFY_STORE_DOMAIN,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const host = candidate.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
    if (host.endsWith(".myshopify.com")) return host;
  }
  return "8j5skn-jn.myshopify.com";
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Brand domain hosts Next.js; Shopify checkout lives on *.myshopify.com.
  if (pathname.startsWith("/cart/c/") || pathname.startsWith("/checkouts/")) {
    const url = new URL(`${pathname}${search}`, `https://${shopifyCheckoutHost()}`);
    return NextResponse.redirect(url);
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
