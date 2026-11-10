import { path } from "@/lib/path";
import { sessionCookieOptions, sessionLifetime } from "@/lib/security";
import {
  discoverCustomerAccount,
  exchangeAuthorizationCode,
  fetchShopifyCustomer,
  shopifyAuthConfigured,
} from "@/lib/shopify/customer-auth";
import { absoluteUrl, publicOrigin } from "@/lib/site-url";
import {
  attachShopifySub,
  createSession,
  createUser,
  findUserByEmail,
  findUserByShopifySub,
  type StoredUser,
} from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION = "scentoria_session";
const STATE = "shopify_oauth_state";
const VERIFIER = "shopify_oauth_verifier";
const NEXT = "shopify_oauth_next";

async function resolveShopifyUser(customer: { id: string; email: string; name: string }): Promise<StoredUser> {
  const bySub = await findUserByShopifySub(customer.id);
  if (bySub) return bySub;

  const byEmail = await findUserByEmail(customer.email);
  if (byEmail) {
    // Same email as Google/email account: link Shopify and sign in to that account.
    const linked = await attachShopifySub(byEmail.id, customer.id);
    return linked || byEmail;
  }

  try {
    return await createUser({
      email: customer.email,
      name: customer.name,
      provider: "shopify",
      shopifySub: customer.id,
    });
  } catch {
    // Race / unique email: load existing and attach.
    const existing = await findUserByEmail(customer.email);
    if (!existing) throw new Error("shopify-user");
    const linked = await attachShopifySub(existing.id, customer.id);
    return linked || existing;
  }
}

export async function GET(request: Request) {
  const origin = publicOrigin(request);
  const jar = await cookies();
  const next = jar.get(NEXT)?.value || path("en", "/account");
  const failLocale = next.startsWith("/hy") ? "hy" : "en";
  const fail = (code = "shopify") =>
    new URL(path(failLocale, `/login?error=${encodeURIComponent(code)}`), origin);

  const clearOauth = () => {
    jar.delete(STATE);
    jar.delete(VERIFIER);
    jar.delete(NEXT);
  };

  if (!shopifyAuthConfigured()) {
    clearOauth();
    return NextResponse.redirect(fail("shopify"));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const expectedState = jar.get(STATE)?.value || "";
  const verifier = jar.get(VERIFIER)?.value || "";

  if (!code || !state || !verifier || state !== expectedState) {
    clearOauth();
    return NextResponse.redirect(fail("shopify"));
  }

  try {
    const discovery = await discoverCustomerAccount();
    const redirectUri = absoluteUrl(request, "/api/auth/shopify/callback");
    const tokens = await exchangeAuthorizationCode({
      discovery,
      code,
      redirectUri,
      verifier,
    });
    const customer = await fetchShopifyCustomer(discovery, tokens.access_token!, tokens.id_token);
    if (!customer.email.includes("@")) {
      clearOauth();
      return NextResponse.redirect(fail("shopify"));
    }

    const user = await resolveShopifyUser(customer);
    const token = await createSession(user.id, sessionLifetime(true));
    jar.set(SESSION, token, sessionCookieOptions(true));
    clearOauth();
    return NextResponse.redirect(new URL(next, origin));
  } catch {
    clearOauth();
    return NextResponse.redirect(fail("shopify"));
  }
}
