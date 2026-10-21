# Phase A database (Garth Heckman)

Migrations live in `migrations/` and are concatenated into **`APPLY_PHASE_A.sql`** for a one-shot paste into the Supabase SQL Editor.

## Blog CMS (`APPLY_BLOG.sql`)

1. Open [SQL Editor](https://supabase.com/dashboard/project/cnsmezewkpgqkhuvwfts/sql/new)
2. Paste **`APPLY_BLOG.sql`** and click **Run**
3. Reload `/admin/blog` — the three site posts seed automatically on first load

Or with CLI:

```bash
npx supabase db push --db-url "postgresql://postgres.[REF]:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

## Apply Phase A (required)


1. Open [SQL Editor](https://supabase.com/dashboard/project/cnsmezewkpgqkhuvwfts/sql/new)
2. Paste the full contents of `APPLY_PHASE_A.sql`
3. Click **Run**
4. Confirm: Table Editor shows `stores`, `products`, `orders`, etc.
5. Add `SUPABASE_SERVICE_ROLE_KEY` to storefront + admin `.env.local` for order writes

Or with CLI (needs DB password from Project Settings → Database):

```bash
npx supabase db push --db-url "postgresql://postgres.[REF]:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

## What’s included

| Domain | Tables |
|--------|--------|
| Tenancy | accounts, stores, store_memberships |
| Catalog | categories, tags, collections, products, options, variants, joins |
| Media | media, product_media, product_variant_media, store_settings |
| Blog | blog_posts (see `APPLY_BLOG.sql`) |
| Customers / cart | customers, addresses, carts, cart_items, discounts, coupons |
| Orders / pay | orders, order_items, order_addresses, payments, webhooks, entitlements |
| Seed | Garth store + 7 products + promos WTFU10 / SHIPFREE / GARTH5 |

Money is **bigint cents**. PWYW and Printify fields are first-class on products/orders.

Store id (stable): `0001`
