import { path } from "@/lib/path";
import { sessionCookieOptions, sessionLifetime } from "@/lib/security";
import {
  discoverCustomerAccount,
  exchangeAuthorizationCode,
  fetchShopifyCustomer,
  shopifyAuthConfigured,
} from "@/lib/shopify/customer-auth";
import {
  attachShopifySub,
  createSession,
  createUser,
  findUserByEmail,
  findUserByShopifySub,
} from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION = "scentoria_session";
const STATE = "shopify_oauth_state";
const VERIFIER = "shopify_oauth_verifier";
const NEXT = "shopify_oauth_next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const next = jar.get(NEXT)?.value || path("en", "/account");
  const failLocale = next.startsWith("/hy") ? "hy" : "en";
  const fail = new URL(path(failLocale, "/login?error=shopify"), url.origin);

  const clearOauth = () => {
    jar.delete(STATE);
    jar.delete(VERIFIER);
    jar.delete(NEXT);
  };

  if (!shopifyAuthConfigured()) {
    clearOauth();
    return NextResponse.redirect(fail);
  }

  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const expectedState = jar.get(STATE)?.value || "";
  const verifier = jar.get(VERIFIER)?.value || "";

  if (!code || !state || !verifier || state !== expectedState) {
    clearOauth();
    return NextResponse.redirect(fail);
  }

  try {
    const discovery = await discoverCustomerAccount();
    const redirectUri = `${url.origin}/api/auth/shopify/callback`;
    const tokens = await exchangeAuthorizationCode({
      discovery,
      code,
      redirectUri,
      verifier,
    });
    const customer = await fetchShopifyCustomer(discovery, tokens.access_token!);

    let user = await findUserByShopifySub(customer.id);
    if (!user) {
      const existing = await findUserByEmail(customer.email);
      if (existing) {
        user = (await attachShopifySub(existing.id, customer.id)) || existing;
      } else {
        user = await createUser({
          email: customer.email,
          name: customer.name,
          provider: "shopify",
          shopifySub: customer.id,
        });
      }
    }

    const token = await createSession(user.id, sessionLifetime(true));
    jar.set(SESSION, token, sessionCookieOptions(true));
    clearOauth();
    return NextResponse.redirect(new URL(next, url.origin));
  } catch {
    clearOauth();
    return NextResponse.redirect(fail);
  }
}
