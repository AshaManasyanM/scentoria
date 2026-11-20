export const shopDomain =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ??
  process.env.SHOPIFY_STORE_DOMAIN ??
  "gfc5xh-m1.myshopify.com";

export const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

export const storefrontApi = `https://${shopDomain}/api/2025-01/graphql.json`;

export const shopAccountUrl = `https://${shopDomain}/account`;

export function hasStorefrontToken() {
  return storefrontToken.length > 0;
}

/**
 * Shopify may return checkout URLs on the brand domain (scentoriaprive.com).
 * That host serves this Next app, so /cart/c/... 404s after locale middleware.
 * Always send checkout to the myshopify.com shop host.
 */
export function shopifyCheckoutUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const next = new URL(url, `https://${shopDomain}`);
    next.protocol = "https:";
    next.host = shopDomain;
    return next.toString();
  } catch {
    return url;
  }
}
