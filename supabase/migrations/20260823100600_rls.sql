-- Phase A — RLS policies
-- Public storefront: read active catalog.
-- Customers: own carts/orders via customer_auth_links.
-- Staff: store_memberships.
-- Service role bypasses RLS for checkout writes.

alter table public.accounts enable row level security;
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_variant_option_values enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_tags enable row level security;
alter table public.collection_products enable row level security;
alter table public.related_products enable row level security;
alter table public.media enable row level security;
alter table public.product_media enable row level security;
alter table public.product_variant_media enable row level security;
alter table public.store_settings enable row level security;
alter table public.customers enable row level security;
alter table public.customer_auth_links enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.discounts enable row level security;
alter table public.coupons enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.cart_discounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_addresses enable row level security;
alter table public.payments enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhooks enable row level security;
alter table public.digital_assets enable row level security;
alter table public.download_entitlements enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.notification_events enable row level security;

-- Stores: public can read active stores
drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores
  for select to anon, authenticated
  using (status = 'active');

drop policy if exists stores_member_all on public.stores;
create policy stores_member_all on public.stores
  for all to authenticated
  using (public.is_store_member(id))
  with check (public.is_store_member(id));

-- Catalog public read (active / visible)
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    status in ('active', 'coming-soon')
    and visibility in ('visible', 'catalog_only', 'search_only')
  );

drop policy if exists products_member_all on public.products;
create policy products_member_all on public.products
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.status in ('active', 'coming-soon')
        and p.visibility in ('visible', 'catalog_only', 'search_only')
    )
  );

drop policy if exists variants_member_all on public.product_variants;
create policy variants_member_all on public.product_variants
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (status = 'active');

drop policy if exists categories_member_all on public.categories;
create policy categories_member_all on public.categories
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags
  for select to anon, authenticated
  using (true);

drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections
  for select to anon, authenticated
  using (status = 'active');

drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media
  for select to anon, authenticated
  using (is_public = true);

drop policy if exists coupons_public_read on public.coupons;
create policy coupons_public_read on public.coupons
  for select to anon, authenticated
  using (status = 'active');

drop policy if exists discounts_public_read on public.discounts;
create policy discounts_public_read on public.discounts
  for select to anon, authenticated
  using (status = 'active');

-- Staff full access helper policies on commerce tables
drop policy if exists orders_member_all on public.orders;
create policy orders_member_all on public.orders
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists order_items_member_select on public.order_items;
create policy order_items_member_select on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.is_store_member(o.store_id)
    )
  );

drop policy if exists customers_member_all on public.customers;
create policy customers_member_all on public.customers
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists carts_member_all on public.carts;
create policy carts_member_all on public.carts
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- Customer can read own orders when linked
drop policy if exists orders_customer_read on public.orders;
create policy orders_customer_read on public.orders
  for select to authenticated
  using (
    exists (
      select 1
      from public.customers c
      join public.customer_auth_links l on l.customer_id = c.id
      where c.id = orders.customer_id
        and l.auth_user_id = auth.uid()
    )
  );

drop policy if exists entitlements_customer_read on public.download_entitlements;
create policy entitlements_customer_read on public.download_entitlements
  for select to authenticated
  using (
    exists (
      select 1
      from public.customer_auth_links l
      where l.customer_id = download_entitlements.customer_id
        and l.auth_user_id = auth.uid()
    )
  );

-- Grants for Data API (RLS still applies)
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Authenticated members need write on commerce tables (policies gate rows)
grant insert, update, delete on all tables in schema public to authenticated;
