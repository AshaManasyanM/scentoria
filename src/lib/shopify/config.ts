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
