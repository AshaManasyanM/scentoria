import { storefrontApi, storefrontToken } from "./config";

export async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T | null> {
  if (!storefrontToken) return null;

  try {
    const res = await fetch(storefrontApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown };
    if (json.errors) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}
