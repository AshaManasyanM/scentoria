export const shopDomain =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ??
  process.env.SHOPIFY_STORE_DOMAIN ??
  "8j5skn-jn.myshopify.com";

export const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

export const storefrontApi = `https://${shopDomain}/api/2025-01/graphql.json`;

export const shopAccountUrl = `https://${shopDomain}/account`;

/** Next.js storefront hosts — never use these for Shopify checkout. */
const STOREFRONT_HOSTS = new Set(["scentoriaprive.com", "www.scentoriaprive.com"]);

export function hasStorefrontToken() {
  return storefrontToken.length > 0;
}

function hostFrom(value: string) {
  return value.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
}

/**
 * Preferred Shopify-hosted checkout host when the API still returns the
 * storefront apex (legacy). Prefer checkout subdomain, then *.myshopify.com.
 */
export function shopifyCheckoutHost() {
  const candidates = [
    process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN,
    process.env.SHOPIFY_CHECKOUT_DOMAIN,
    "checkout.scentoriaprive.com",
    shopDomain,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const host = hostFrom(candidate);
    if (!host || STOREFRONT_HOSTS.has(host)) continue;
    return host;
  }
  return "8j5skn-jn.myshopify.com";
}

/**
 * Keep Shopify's checkout host as returned (e.g. checkout.scentoriaprive.com).
 * Only rewrite if the URL still points at the Next.js storefront apex.
 */
export function shopifyCheckoutUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const next = new URL(url);
    next.protocol = "https:";
    if (STOREFRONT_HOSTS.has(next.host.toLowerCase())) {
      next.host = shopifyCheckoutHost();
    }
    return next.toString();
  } catch {
    return url;
  }
}

/** Append a discount code without changing the checkout host. */
export function withCheckoutDiscount(url: string | null | undefined, code: string) {
  const base = shopifyCheckoutUrl(url);
  if (!base) return null;
  if (!code.trim()) return base;
  try {
    const next = new URL(base);
    next.searchParams.set("discount", code.trim());
    return next.toString();
  } catch {
    return base;
  }
}
