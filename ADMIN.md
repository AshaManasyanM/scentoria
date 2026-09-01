# Shopify Admin — add a new perfume

Admin: https://gfc5xh-m1.myshopify.com/admin

1. **Products → Add product**
2. Title, photos, description
3. Variants for each size (5 ml / 10 ml decant, 50 ml, 100 ml) with price and stock
4. Tags: `men` / `women` / `unisex`, note names (`floral`, `woody`, …), `sale`, `new`, `bestseller`
5. **Save** and **Publish**

The Scentoria site reads the Storefront API. Until `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set in `.env.local`, the site shows a sample catalog.

## Storefront token

1. Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Create an app → Storefront API → `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts` (cart)
3. Install, copy the Storefront token
4. Create `.env.local`:

```
SHOPIFY_STORE_DOMAIN=gfc5xh-m1.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token
```

Restart `npm run dev`.
