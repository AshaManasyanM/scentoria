import { createHash, randomBytes } from "crypto";
import { shopDomain } from "@/lib/shopify/config";

export type CustomerAccountDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
  graphql_api?: string;
};

export type ShopifyCustomerProfile = {
  id: string;
  email: string;
  name: string;
};

const CUSTOMER_QUERY = `#graphql
  query CustomerProfile {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
`;

export function shopifyCustomerClientId() {
  return (
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() ||
    ""
  );
}

export function shopifyCustomerClientSecret() {
  return process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET?.trim() || "";
}

export function shopifyAuthConfigured() {
  return shopifyCustomerClientId().length > 0;
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("hex");
  return { verifier, challenge, state };
}

export async function discoverCustomerAccount(): Promise<CustomerAccountDiscovery> {
  const urls = [
    `https://${shopDomain}/.well-known/customer-account-api`,
    `https://${shopDomain}/.well-known/openid-configuration`,
  ];
  for (const url of urls) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;
    const data = (await res.json()) as Record<string, unknown>;
    const authorization = String(
      data.authorization_endpoint || data.auth_endpoint || data.authorizationEndpoint || "",
    );
    const token = String(data.token_endpoint || data.tokenEndpoint || "");
    if (!authorization || !token) continue;
    return {
      authorization_endpoint: authorization,
      token_endpoint: token,
      end_session_endpoint: String(data.end_session_endpoint || data.logout_endpoint || "") || undefined,
      graphql_api: String(data.graphql_api || data.graphqlApi || "") || undefined,
    };
  }
  throw new Error("shopify-discovery");
}

export function buildAuthorizeUrl(input: {
  discovery: CustomerAccountDiscovery;
  redirectUri: string;
  state: string;
  challenge: string;
  locale?: string;
}) {
  const clientId = shopifyCustomerClientId();
  const url = new URL(input.discovery.authorization_endpoint);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", "openid email customer-account-api:full");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (input.locale) url.searchParams.set("locale", input.locale);
  return url.toString();
}

export async function exchangeAuthorizationCode(input: {
  discovery: CustomerAccountDiscovery;
  code: string;
  redirectUri: string;
  verifier: string;
}) {
  const clientId = shopifyCustomerClientId();
  const secret = shopifyCustomerClientSecret();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
  });
  const headers: HeadersInit = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (secret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`;
  }
  const res = await fetch(input.discovery.token_endpoint, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("shopify-token");
  const data = (await res.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!data.access_token) throw new Error("shopify-token");
  return data;
}

function profileFromIdToken(idToken?: string): ShopifyCustomerProfile | null {
  if (!idToken) return null;
  try {
    const part = idToken.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part, "base64url").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!email.includes("@") || !sub) return null;
    const name =
      (typeof payload.name === "string" && payload.name.trim()) ||
      [payload.given_name, payload.family_name]
        .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
        .join(" ")
        .trim() ||
      email.split("@")[0] ||
      email;
    return { id: sub, email, name: name.slice(0, 80) };
  } catch {
    return null;
  }
}

async function profileFromGraphql(
  discovery: CustomerAccountDiscovery,
  accessToken: string,
): Promise<ShopifyCustomerProfile | null> {
  const endpoint =
    discovery.graphql_api ||
    `https://shopify.com/${shopDomain.replace(/\.myshopify\.com$/i, "")}/account/customer/api/2025-01/graphql`;
  const authValues = accessToken.startsWith("shcat_")
    ? [accessToken, `Bearer ${accessToken}`]
    : [`Bearer ${accessToken}`, accessToken];

  for (const authorization of authValues) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({ query: CUSTOMER_QUERY }),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const payload = (await res.json()) as {
        data?: {
          customer?: {
            id?: string;
            firstName?: string | null;
            lastName?: string | null;
            emailAddress?: { emailAddress?: string | null } | null;
          } | null;
        };
      };
      const customer = payload.data?.customer;
      const email = customer?.emailAddress?.emailAddress?.trim().toLowerCase() || "";
      const id = customer?.id?.trim() || "";
      if (!customer || !email || !id) continue;
      const name =
        [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
        email.split("@")[0] ||
        email;
      return { id, email, name };
    } catch {
      /* try next auth header */
    }
  }
  return null;
}

export async function fetchShopifyCustomer(
  discovery: CustomerAccountDiscovery,
  accessToken: string,
  idToken?: string,
): Promise<ShopifyCustomerProfile> {
  const fromGraphql = await profileFromGraphql(discovery, accessToken);
  const fromToken = profileFromIdToken(idToken);
  if (fromGraphql) {
    return {
      id: fromGraphql.id,
      email: fromGraphql.email || fromToken?.email || "",
      name: fromGraphql.name || fromToken?.name || fromGraphql.email,
    };
  }
  if (fromToken) return fromToken;
  throw new Error("shopify-customer");
}
