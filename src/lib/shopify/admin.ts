import { shopDomain } from "./config";

const adminApi = `https://${shopDomain}/admin/api/2025-01/graphql.json`;

let cached: { token: string; expiresAt: number } | null = null;

export async function adminToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const clientId = process.env.SHOPIFY_CLIENT_ID ?? "";
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return json.access_token;
  } catch {
    return null;
  }
}

export async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  const token = await adminToken();
  if (!token) return null;
  try {
    const res = await fetch(adminApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown };
    if (json.errors || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}
