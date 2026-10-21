# Shared-database storefront setup

This project serves several independent storefronts from the same deployment
and Supabase project. The host name selects the tenant; the browser does not
send a `store_id`.

## 1. Apply the migration

Run `supabase/migrations/20260902150000_multi_store_demo_tenants.sql` in the
Supabase SQL Editor connected to the shared database. It is idempotent and
only inserts/updates demo stores `1001` and `1002`; it does not modify Garth
Heckman (`0001`).

The migration creates:

- `Northstar Goods` (`1001`) — `fashion.localhost`
- `Hearth & Loom` (`1002`) — `home.localhost`
- `store_domains`, categories, products, variants, demo customers, coupons,
  shipping/tax/payment settings, and store-scoped data for each new store.

## 2. Run locally

Start the app normally:

```bash
npm run dev
```

Open these exact addresses:

```text
http://localhost:3000          Garth Heckman (store 0001)
http://fashion.localhost:3000  Northstar Goods (store 1001)
http://home.localhost:3000     Hearth & Loom (store 1002)
```

Modern browsers resolve `*.localhost` to your machine automatically.

## 3. Production domains

Point each subdomain at the same Next.js/Render service, then add it to
`store_domains`:

```sql
insert into public.store_domains (store_id, domain, is_primary)
values ('1001', 'shop.northstargoods.com', true)
on conflict (domain) do update set store_id = excluded.store_id, is_primary = excluded.is_primary;
```

Repeat for each store. Leave exactly one `is_primary = true` domain per store.

## 4. Admin users and customer logins

Create Auth users in Supabase Auth first. Then attach each admin to only its
own store:

```sql
insert into public.store_memberships (store_id, user_id, role_key, status)
values ('1001', '<SUPABASE_AUTH_USER_UUID>', 'store_admin', 'active');
```

Do not insert passwords into SQL migrations. Customer records are seeded, but
customer account credentials must be created via the account setup/login flow.

## 5. Verify isolation

Run these after testing checkout in both storefronts:

```sql
-- No order may point to a customer from another store.
select count(*) as invalid_orders
from public.orders o
join public.customers c on c.id = o.customer_id
where o.store_id <> c.store_id;

-- No product/category cross-store relationship is allowed.
select count(*) as invalid_product_categories
from public.product_categories pc
join public.products p on p.id = pc.product_id
join public.categories c on c.id = pc.category_id
where p.store_id <> c.store_id;

-- Quick tenant row counts.
select store_id, count(*) as products from public.products group by store_id order by store_id;
select store_id, count(*) as customers from public.customers group by store_id order by store_id;
select store_id, count(*) as orders from public.orders group by store_id order by store_id;
```

Each `invalid_*` result must be `0`.
