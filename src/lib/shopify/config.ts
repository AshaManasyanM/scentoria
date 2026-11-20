export const shopDomain =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ??
  process.env.SHOPIFY_STORE_DOMAIN ??
  "8j5skn-jn.myshopify.com";

export const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

export const storefrontApi = `https://${shopDomain}/api/2025-01/graphql.json`;

export const shopAccountUrl = `https://${shopDomain}/account`;

export function hasStorefrontToken() {
  return storefrontToken.length > 0;
}

function hostFrom(value: string) {
  return value.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
}

/**
 * Checkout must use a *.myshopify.com host. The brand domain serves this Next app,
 * so Shopify cart URLs on scentoriaprive.com 404.
 */
export function shopifyCheckoutHost() {
  const candidates = [
    process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN,
    process.env.SHOPIFY_CHECKOUT_DOMAIN,
    shopDomain,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const host = hostFrom(candidate);
    if (host.endsWith(".myshopify.com")) return host;
  }
  return "8j5skn-jn.myshopify.com";
}

/**
 * Shopify may return checkout URLs on the brand domain (scentoriaprive.com).
 * Always send checkout to the myshopify.com shop host.
 */
export function shopifyCheckoutUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const host = shopifyCheckoutHost();
  try {
    const next = new URL(url, `https://${host}`);
    next.protocol = "https:";
    next.host = host;
    return next.toString();
  } catch {
    return url;
  }
}
