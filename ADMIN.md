# Shopify Admin — add a new perfume

Admin: https://gfc5xh-m1.myshopify.com/admin

1. **Products → Add product**
2. Title, photos, description
3. Variants for each size (5 ml / 10 ml decant, 50 ml, 100 ml) with price and stock
4. Tags: `men` / `women` / `unisex`, note names (`floral`, `woody`, …), `sale`, `new`, `bestseller`
5. **Save** and **Publish**

The Scentoria Prive site reads the Storefront API. Until `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set in `.env.local`, the site shows a sample catalog.

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

## Shopify login (Customer Account API)

1. Shopify Admin → Sales channels → **Headless** (or Hydrogen) → Customer Account API
2. Copy the client ID (and secret if confidential)
3. Add callback URL: `https://YOUR_DOMAIN/api/auth/shopify/callback` (local: `http://localhost:3000/api/auth/shopify/callback`)
4. In `.env.local`:

```
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=your_client_id
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET=your_secret
NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=your_client_id
```

Restart `npm run dev`. The login page shows **Continue with Shopify**.
