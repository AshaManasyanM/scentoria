import { path } from "@/lib/path";
import { browserCookieOptions } from "@/lib/security";
import {
  buildAuthorizeUrl,
  createPkcePair,
  discoverCustomerAccount,
  shopifyAuthConfigured,
} from "@/lib/shopify/customer-auth";
import { absoluteUrl, publicOrigin } from "@/lib/site-url";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STATE = "shopify_oauth_state";
const VERIFIER = "shopify_oauth_verifier";
const NEXT = "shopify_oauth_next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = publicOrigin(request);
  const locale = url.searchParams.get("locale") === "hy" ? "hy" : "en";
  const next = url.searchParams.get("next") || path(locale, "/account");
  const loginPath = path(locale, `/login?error=shopify`);

  if (!shopifyAuthConfigured()) {
    return NextResponse.redirect(new URL(loginPath, origin));
  }

  try {
    const discovery = await discoverCustomerAccount();
    const { verifier, challenge, state } = createPkcePair();
    const redirectUri = absoluteUrl(request, "/api/auth/shopify/callback");
    const authorize = buildAuthorizeUrl({
      discovery,
      redirectUri,
      state,
      challenge,
      locale,
    });

    const jar = await cookies();
    const cookie = browserCookieOptions(true);
    jar.set(STATE, state, { ...cookie, maxAge: 600 });
    jar.set(VERIFIER, verifier, { ...cookie, maxAge: 600 });
    jar.set(NEXT, next.slice(0, 500), { ...cookie, maxAge: 600 });

    return NextResponse.redirect(authorize);
  } catch {
    return NextResponse.redirect(new URL(loginPath, origin));
  }
}
