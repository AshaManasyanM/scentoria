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
4. In `.env.local` / production env:

```
NEXT_PUBLIC_SITE_URL=https://scentoriaprive.com
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=your_client_id
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET=your_secret
NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=your_client_id
```

`NEXT_PUBLIC_SITE_URL` (or `SITE_URL`) sets the OAuth `redirect_uri` when Next runs behind a reverse proxy that would otherwise report `localhost`. Locally you can omit it and the app uses `http://localhost:3000`.

Restart `npm run dev`. The login page shows **Continue with Shopify**.

## Auto-sync brands (Collections + metaobjects)

When a product is created or updated with a **Vendor** (brand), the site webhook ensures:

1. A Shopify **Collection** with that brand name/handle exists (powers `/brands` logos when an image is set)
2. A **`brand` metaobject** with field `name` exists (optional `logo`, `description`)

### One-time Admin setup

1. **Metaobject definition** → Create type `brand` with fields:
   - `name` — single line text (required)
   - `logo` — file or URL (optional)
   - `description` — multi-line text (optional)
2. **Custom app** (Develop apps) client credentials scopes:
   - `read_products`, `write_products`
   - `read_publications`, `write_publications` (publish brand collections to **Online Store** + **Scentoria Headless**)
   - `read_metaobjects`, `write_metaobjects`, `read_metaobject_definitions`
3. Env (production / `.env.local`):

```
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

`SHOPIFY_WEBHOOK_SECRET` can match the app client secret if you use that for HMAC.

4. **Webhooks** → Subscribe:
   - `products/create` → `https://YOUR_DOMAIN/api/webhooks/shopify`
   - `products/update` → `https://YOUR_DOMAIN/api/webhooks/shopify`

Set product **Vendor** to the brand name (not “My Store”). Logos stay manual: add a collection image or a `logo` on the brand metaobject.

Brand collections are published to **Online Store** + **Scentoria Headless** only (not Shop / POS).

### One-time sync of existing vendors

After deploy, run once on the production server (idempotent, safe to re-run):

```bash
BRAND_SYNC_CONFIRM=YES npm run sync:brands
```

If `BRAND_SYNC_SECRET` is set in env:

```bash
BRAND_SYNC_CONFIRM=YES BRAND_SYNC_TOKEN="$BRAND_SYNC_SECRET" npm run sync:brands
```

This paginates all Admin products, groups by Vendor, ensures Collection + `brand` metaobject, links products, and publishes both sales channels. It does **not** change prices, inventory, or vendor names.
