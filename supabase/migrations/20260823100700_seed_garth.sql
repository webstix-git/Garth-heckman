-- Phase A — seed Garth Heckman store + promos + core catalog rows
-- Stable UUIDs so apps can reference the store.

insert into public.accounts (id, name, slug, status)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Garth Heckman',
  'garth-heckman',
  'active'
)
on conflict (slug) do update set name = excluded.name, updated_at = now();

insert into public.stores (
  id, account_id, name, slug, status, currency, timezone, default_locale, default_country_code
) values (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Garth Heckman',
  'garthheckman',
  'active',
  'USD',
  'America/Chicago',
  'en-US',
  'US'
)
on conflict (account_id, slug) do update
  set name = excluded.name, updated_at = now();

insert into public.store_settings (store_id, general, checkout, payment, tax, shipping)
values (
  'b0000000-0000-4000-8000-000000000001',
  '{"mission":"Make God look good.","site":"https://garthheckman.com"}'::jsonb,
  '{"sample_checkout":true}'::jsonb,
  '{"providers":["paypal","venmo"]}'::jsonb,
  '{"bps":688}'::jsonb,
  '{"flat_cents":695,"free_at_cents":7500}'::jsonb
)
on conflict (store_id) do update set general = excluded.general, updated_at = now();

-- Categories
insert into public.categories (id, store_id, name, slug, description, sort_order)
values
  ('c1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Books', 'books', 'Print and audio titles from Garth.', 1),
  ('c1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Digital & Resources', 'digital', 'Instant downloads.', 2),
  ('c1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Merchandise', 'merch', 'WTFU branded goods.', 3)
on conflict (store_id, slug) do nothing;

insert into public.collections (id, store_id, name, slug, description, sort_order)
values
  ('d1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Featured', 'featured', null, 1),
  ('d1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'The WTFU Collection', 'wtfu-collection', null, 2),
  ('d1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Triple C Survivor', 'triple-c', null, 3)
on conflict (store_id, slug) do nothing;

-- Promos matching storefront PROMOS
insert into public.discounts (id, store_id, name, discount_type, value, status)
values
  ('e1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '10% off', 'percent', 10, 'active'),
  ('e1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Free shipping', 'shipping', 0, 'active'),
  ('e1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '$5 off', 'amount', 500, 'active')
on conflict do nothing;

insert into public.coupons (store_id, discount_id, code, status)
values
  ('b0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'WTFU10', 'active'),
  ('b0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'SHIPFREE', 'active'),
  ('b0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', 'GARTH5', 'active')
on conflict (store_id, code) do nothing;

-- Core products (IDs stable for bridging from catalog-source.js)
insert into public.products (
  id, store_id, name, slug, product_type, status, visibility,
  short_description, sku, fulfillment,
  price_cents, pwyw_min_cents, pwyw_max_cents, pwyw_suggested_cents,
  track_inventory, requires_shipping, inventory_qty, is_featured, published_at,
  seo_title, seo_description
) values
(
  'f1000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'Wake The Faith Up', 'wtfu-book', 'pwyw', 'active', 'visible',
  'WTFU, Revelation 3:1–3', 'WTFU-BOOK', 'self',
  null, 1000, 50000, 1000,
  false, true, null, true, now(),
  'Wake The Faith Up (WTFU), pay what you want | Garth Heckman',
  'Pay what you want for Wake the Faith Up.'
),
(
  'f1000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000001',
  'Wake The Faith Up (Audiobook)', 'wtfu-audiobook', 'pwyw', 'active', 'visible',
  'Read by Garth Heckman', 'WTFU-AUDIO', 'download',
  null, 100, 50000, 1000,
  false, false, null, true, now(),
  'WTFU Audiobook | Garth Heckman',
  'Wake the Faith Up, read by Garth Heckman.'
),
(
  'f1000000-0000-4000-8000-000000000003',
  'b0000000-0000-4000-8000-000000000001',
  'Burn This Book', 'burn-this-book', 'digital', 'active', 'visible',
  'PDF', 'BURN-PDF', 'download',
  500, null, null, null,
  false, false, null, false, now(),
  'Burn This Book (PDF), $5 | Garth Heckman',
  '30-chapter youth devotional PDF.'
),
(
  'f1000000-0000-4000-8000-000000000004',
  'b0000000-0000-4000-8000-000000000001',
  'Generations Training Deck', 'generations-training-deck', 'digital', 'active', 'visible',
  'PDF, multigenerational ministry training', 'GEN-DECK', 'download',
  0, null, null, null,
  false, false, null, false, now(),
  'Generations Training Deck (PDF), free | Garth Heckman',
  'Free generational-dynamics training deck.'
),
(
  'f1000000-0000-4000-8000-000000000005',
  'b0000000-0000-4000-8000-000000000001',
  'WTFU Tee', 'wtfu-tee', 'variable', 'active', 'visible',
  'Heavyweight cotton, front lockup', 'WTFU-TEE', 'printify',
  null, null, null, null,
  true, true, null, true, now(),
  'WTFU Tee | Garth Heckman',
  'Heavyweight cotton tee with the WTFU lockup.'
),
(
  'f1000000-0000-4000-8000-000000000006',
  'b0000000-0000-4000-8000-000000000001',
  'WTFU Mug', 'wtfu-mug', 'variable', 'active', 'visible',
  'Ceramic, dishwasher safe', 'WTFU-MUG', 'printify',
  null, null, null, null,
  true, true, null, false, now(),
  'WTFU Mug | Garth Heckman',
  'Ceramic WTFU mug, 11oz or 15oz.'
),
(
  'f1000000-0000-4000-8000-000000000007',
  'b0000000-0000-4000-8000-000000000001',
  'WTFU Journal', 'wtfu-journal', 'simple', 'active', 'visible',
  'Hardcover, lined, 128 pages', 'WTFU-JRNL', 'printify',
  2400, null, null, null,
  true, true, 100, false, now(),
  'WTFU Journal | Garth Heckman',
  'Hardcover lined WTFU journal.'
)
on conflict (store_id, slug) do update set
  name = excluded.name,
  product_type = excluded.product_type,
  fulfillment = excluded.fulfillment,
  price_cents = excluded.price_cents,
  pwyw_min_cents = excluded.pwyw_min_cents,
  pwyw_max_cents = excluded.pwyw_max_cents,
  pwyw_suggested_cents = excluded.pwyw_suggested_cents,
  updated_at = now();

-- Link products to categories / collections
insert into public.product_categories (product_id, category_id, position)
values
  ('f1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 0),
  ('f1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 1),
  ('f1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000002', 0),
  ('f1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000002', 1),
  ('f1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000003', 0),
  ('f1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000003', 1),
  ('f1000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000003', 2)
on conflict do nothing;

insert into public.collection_products (collection_id, product_id, position)
values
  ('d1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 0),
  ('d1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 0),
  ('d1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000005', 1)
on conflict do nothing;

-- Tee options + a couple of variants (full matrix can be synced later)
insert into public.product_options (id, product_id, name, display_type, position)
values
  ('aa100000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000005', 'Color', 'swatch', 0),
  ('aa100000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000005', 'Size', 'button', 1)
on conflict do nothing;

insert into public.product_option_values (id, product_option_id, value, display_label, position)
values
  ('ab100000-0000-4000-8000-000000000001', 'aa100000-0000-4000-8000-000000000001', 'black', 'Black', 0),
  ('ab100000-0000-4000-8000-000000000002', 'aa100000-0000-4000-8000-000000000002', 'm', 'M', 0),
  ('ab100000-0000-4000-8000-000000000003', 'aa100000-0000-4000-8000-000000000002', 'l', 'L', 1)
on conflict do nothing;

insert into public.product_variants (
  id, store_id, product_id, title, sku, price_cents, inventory_qty, status, position
) values
(
  'ac100000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000005',
  'Black / M', 'WTFU-TEE-BLK-M', 3200, 25, 'active', 0
),
(
  'ac100000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000005',
  'Black / L', 'WTFU-TEE-BLK-L', 3200, 25, 'active', 1
)
on conflict (store_id, sku) do update set price_cents = excluded.price_cents, updated_at = now();

insert into public.product_variant_option_values (variant_id, option_value_id)
values
  ('ac100000-0000-4000-8000-000000000001', 'ab100000-0000-4000-8000-000000000001'),
  ('ac100000-0000-4000-8000-000000000001', 'ab100000-0000-4000-8000-000000000002'),
  ('ac100000-0000-4000-8000-000000000002', 'ab100000-0000-4000-8000-000000000001'),
  ('ac100000-0000-4000-8000-000000000002', 'ab100000-0000-4000-8000-000000000003')
on conflict do nothing;
