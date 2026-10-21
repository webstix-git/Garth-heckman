-- Shared-database multi-store demonstration.
-- This migration only adds stores 1001 and 1002; it never updates/deletes store 0001 (Garth Heckman).

create table if not exists public.store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  domain text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (domain)
);

create index if not exists store_domains_store_id_idx on public.store_domains(store_id);
create unique index if not exists store_domains_primary_per_store_idx
  on public.store_domains(store_id) where is_primary;

alter table public.store_domains enable row level security;
drop policy if exists store_domains_public_read on public.store_domains;
create policy store_domains_public_read on public.store_domains
  for select using (true);
drop policy if exists store_domains_member_all on public.store_domains;
create policy store_domains_member_all on public.store_domains
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- Two separate merchant accounts and stores.
insert into public.accounts (id, name, slug, status) values
  ('a2000000-0000-4000-8000-000000000001', 'Northstar Goods', 'northstar-goods', 'active'),
  ('a2000000-0000-4000-8000-000000000002', 'Hearth and Loom', 'hearth-and-loom', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status, updated_at = now();

insert into public.stores (id, account_id, name, slug, status, currency, timezone, default_locale, default_country_code) values
  ('1001', 'a2000000-0000-4000-8000-000000000001', 'Northstar Goods', 'northstar-goods', 'active', 'USD', 'America/New_York', 'en-US', 'US'),
  ('1002', 'a2000000-0000-4000-8000-000000000002', 'Hearth & Loom', 'hearth-and-loom', 'active', 'USD', 'America/Chicago', 'en-US', 'US')
on conflict (account_id, slug) do update set name = excluded.name, status = excluded.status, updated_at = now();

insert into public.store_domains (store_id, domain, is_primary) values
  ('1001', 'fashion.localhost', true),
  ('1001', 'northstar.example.com', false),
  ('1002', 'home.localhost', true),
  ('1002', 'hearth.example.com', false)
on conflict (domain) do update set store_id = excluded.store_id, is_primary = excluded.is_primary;

insert into public.store_settings (store_id, general, storefront, checkout, payment, shipping, tax, seo) values
  ('1001',
   '{"mission":"Well-made everyday layers for city life.","branding":{"primaryColor":"#1f2937","logoText":"Northstar Goods"}}'::jsonb,
   '{"theme":"minimal","homeTitle":"Essential layers. Considered materials."}'::jsonb,
   '{"guestCheckout":false,"customerAccounts":true}'::jsonb,
   '{"providers":["paypal"],"mode":"sandbox"}'::jsonb,
   '{"flat_cents":800,"free_at_cents":10000,"origin":"New York, NY"}'::jsonb,
   '{"inclusive":false,"bps":0}'::jsonb,
   '{"title":"Northstar Goods","description":"Modern essentials for everyday life."}'::jsonb),
  ('1002',
   '{"mission":"Useful objects for a quieter home.","branding":{"primaryColor":"#5f584f","logoText":"Hearth & Loom"}}'::jsonb,
   '{"theme":"minimal","homeTitle":"Thoughtful goods for home."}'::jsonb,
   '{"guestCheckout":false,"customerAccounts":true}'::jsonb,
   '{"providers":["paypal"],"mode":"sandbox"}'::jsonb,
   '{"flat_cents":700,"free_at_cents":8500,"origin":"Chicago, IL"}'::jsonb,
   '{"inclusive":false,"bps":0}'::jsonb,
   '{"title":"Hearth & Loom","description":"Practical pieces for slow living."}'::jsonb)
on conflict (store_id) do update set
  general = excluded.general, storefront = excluded.storefront, checkout = excluded.checkout,
  payment = excluded.payment, shipping = excluded.shipping, tax = excluded.tax, seo = excluded.seo,
  updated_at = now();

insert into public.categories (id, store_id, name, slug, description, sort_order) values
  ('c2000000-0000-4000-8000-000000000001', '1001', 'Outerwear', 'outerwear', 'Weather-ready layers for every day.', 1),
  ('c2000000-0000-4000-8000-000000000002', '1001', 'Shirts & Knits', 'shirts-knits', 'Soft staples with a clean fit.', 2),
  ('c2000000-0000-4000-8000-000000000003', '1001', 'Accessories', 'accessories', 'Useful finishing pieces.', 3),
  ('c3000000-0000-4000-8000-000000000001', '1002', 'Tabletop', 'tabletop', 'For everyday meals and lingering mornings.', 1),
  ('c3000000-0000-4000-8000-000000000002', '1002', 'Textiles', 'textiles', 'Natural fibers for living spaces.', 2),
  ('c3000000-0000-4000-8000-000000000003', '1002', 'Kitchen', 'kitchen', 'Practical tools for a warm kitchen.', 3)
on conflict (store_id, slug) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.collections (id, store_id, name, slug, description, collection_type, status, sort_order) values
  ('d2000000-0000-4000-8000-000000000001', '1001', 'Autumn Layers', 'autumn-layers', 'Core layers for changing weather.', 'manual', 'active', 1),
  ('d3000000-0000-4000-8000-000000000001', '1002', 'Gather at Home', 'gather-at-home', 'Small rituals for the table and home.', 'manual', 'active', 1)
on conflict (store_id, slug) do update set name = excluded.name, description = excluded.description;

-- Store 1001: fashion/lifestyle catalog.
insert into public.products (id, store_id, name, slug, product_type, status, visibility, description, short_description, sku, fulfillment, price_cents, track_inventory, requires_shipping, inventory_qty, is_featured, published_at, metadata, seo_title, seo_description) values
  ('f2000000-0000-4000-8000-000000000001', '1001', 'Field Jacket', 'field-jacket', 'physical', 'active', 'visible', 'A water-resistant cotton field jacket with a relaxed shape, deep utility pockets, and a softly structured collar.', 'Weather-ready cotton layer.', 'NS-FJ-OLV', 'self', 16800, true, true, 28, true, now(), '{"admin_type":"physical","hasVariants":true,"images":["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Field Jacket | Northstar Goods', 'A durable, everyday field jacket.'),
  ('f2000000-0000-4000-8000-000000000002', '1001', 'Merino Crew', 'merino-crew', 'physical', 'active', 'visible', 'Fine merino wool knit with a close-but-comfortable fit for layering through the year.', 'Lightweight merino essential.', 'NS-MC-CRM', 'self', 9800, true, true, 34, true, now(), '{"admin_type":"physical","hasVariants":true,"images":["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Merino Crew | Northstar Goods', 'A lightweight merino crew sweater.'),
  ('f2000000-0000-4000-8000-000000000003', '1001', 'Canvas Market Tote', 'canvas-market-tote', 'physical', 'active', 'visible', 'A structured organic-cotton tote with a reinforced base and interior key loop.', 'Hard-working canvas tote.', 'NS-CMT-NAT', 'self', 3600, true, true, 70, false, now(), '{"admin_type":"physical","images":["https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Canvas Market Tote | Northstar Goods', 'Structured organic-cotton market tote.'),
  ('f2000000-0000-4000-8000-000000000004', '1001', 'Care Guide: Build a Better Wardrobe', 'wardrobe-care-guide', 'digital', 'active', 'visible', 'A practical PDF on buying fewer, better clothes and caring for them well.', 'Digital wardrobe care guide.', 'NS-DIG-CARE', 'download', 1200, false, false, null, false, now(), '{"admin_type":"digital","images":["https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Wardrobe Care Guide | Northstar Goods', 'A practical digital guide to clothes care.')
on conflict (store_id, slug) do update set name = excluded.name, description = excluded.description, short_description = excluded.short_description, price_cents = excluded.price_cents, metadata = excluded.metadata, updated_at = now();

-- Store 1002: home/lifestyle catalog.
insert into public.products (id, store_id, name, slug, product_type, status, visibility, description, short_description, sku, fulfillment, price_cents, track_inventory, requires_shipping, inventory_qty, is_featured, published_at, metadata, seo_title, seo_description) values
  ('f3000000-0000-4000-8000-000000000001', '1002', 'Stoneware Breakfast Set', 'stoneware-breakfast-set', 'physical', 'active', 'visible', 'A hand-finished stoneware mug and bowl set designed for unhurried breakfasts.', 'Hand-finished mug and bowl set.', 'HL-BRK-SND', 'self', 5400, true, true, 42, true, now(), '{"admin_type":"physical","hasVariants":true,"images":["https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Stoneware Breakfast Set | Hearth & Loom', 'A hand-finished stoneware breakfast set.'),
  ('f3000000-0000-4000-8000-000000000002', '1002', 'Washed Linen Table Runner', 'washed-linen-table-runner', 'physical', 'active', 'visible', 'Soft pre-washed linen with a relaxed edge, made to become more comfortable over time.', 'Relaxed linen for the table.', 'HL-LTR-FLX', 'self', 4200, true, true, 36, true, now(), '{"admin_type":"physical","hasVariants":true,"images":["https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Washed Linen Table Runner | Hearth & Loom', 'Soft linen table runner with a relaxed edge.'),
  ('f3000000-0000-4000-8000-000000000003', '1002', 'Olivewood Cooking Spoon', 'olivewood-cooking-spoon', 'physical', 'active', 'visible', 'A smooth olivewood spoon with a generous bowl for sauces, grains, and everyday cooking.', 'Hand-shaped olivewood spoon.', 'HL-OCS-OLV', 'self', 1800, true, true, 80, false, now(), '{"admin_type":"physical","images":["https://images.unsplash.com/photo-1584990347449-a2d4ba56c9e5?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Olivewood Cooking Spoon | Hearth & Loom', 'A hand-shaped olivewood cooking spoon.'),
  ('f3000000-0000-4000-8000-000000000004', '1002', 'The Slow Sunday Meal Plan', 'slow-sunday-meal-plan', 'digital', 'active', 'visible', 'A downloadable collection of simple make-ahead recipes, shopping lists, and a relaxed menu for six.', 'Digital Sunday meal plan.', 'HL-DIG-SUN', 'download', 900, false, false, null, false, now(), '{"admin_type":"digital","images":["https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80"]}'::jsonb, 'Slow Sunday Meal Plan | Hearth & Loom', 'A downloadable meal plan for relaxed Sundays.')
on conflict (store_id, slug) do update set name = excluded.name, description = excluded.description, short_description = excluded.short_description, price_cents = excluded.price_cents, metadata = excluded.metadata, updated_at = now();

insert into public.product_categories (product_id, category_id, position) values
  ('f2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 0),
  ('f2000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 0),
  ('f2000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000003', 0),
  ('f3000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 0),
  ('f3000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000002', 0),
  ('f3000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000003', 0)
on conflict do nothing;

-- Real options and variants are relational, not a separate "variable product" type.
insert into public.product_options (id, product_id, name, display_type, position) values
  ('aa200000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Size', 'button', 0),
  ('aa300000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'Glaze', 'button', 0)
on conflict do nothing;
insert into public.product_option_values (id, product_option_id, value, display_label, position) values
  ('ab200000-0000-4000-8000-000000000001', 'aa200000-0000-4000-8000-000000000001', 'small', 'Small', 0),
  ('ab200000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'medium', 'Medium', 1),
  ('ab200000-0000-4000-8000-000000000003', 'aa200000-0000-4000-8000-000000000001', 'large', 'Large', 2),
  ('ab300000-0000-4000-8000-000000000001', 'aa300000-0000-4000-8000-000000000001', 'sand', 'Sand', 0),
  ('ab300000-0000-4000-8000-000000000002', 'aa300000-0000-4000-8000-000000000001', 'charcoal', 'Charcoal', 1)
on conflict do nothing;
insert into public.product_variants (id, store_id, product_id, title, sku, price_cents, inventory_qty, status, position, requires_shipping, metadata) values
  ('ac200000-0000-4000-8000-000000000001', '1001', 'f2000000-0000-4000-8000-000000000001', 'Small', 'NS-FJ-OLV-S', 16800, 8, 'active', 0, true, '{"machineOptions":{"Size":"small"}}'::jsonb),
  ('ac200000-0000-4000-8000-000000000002', '1001', 'f2000000-0000-4000-8000-000000000001', 'Medium', 'NS-FJ-OLV-M', 16800, 12, 'active', 1, true, '{"machineOptions":{"Size":"medium"}}'::jsonb),
  ('ac200000-0000-4000-8000-000000000003', '1001', 'f2000000-0000-4000-8000-000000000001', 'Large', 'NS-FJ-OLV-L', 16800, 8, 'active', 2, true, '{"machineOptions":{"Size":"large"}}'::jsonb),
  ('ac300000-0000-4000-8000-000000000001', '1002', 'f3000000-0000-4000-8000-000000000001', 'Sand', 'HL-BRK-SND', 5400, 22, 'active', 0, true, '{"machineOptions":{"Glaze":"sand"}}'::jsonb),
  ('ac300000-0000-4000-8000-000000000002', '1002', 'f3000000-0000-4000-8000-000000000001', 'Charcoal', 'HL-BRK-CHR', 5400, 20, 'active', 1, true, '{"machineOptions":{"Glaze":"charcoal"}}'::jsonb)
on conflict (store_id, sku) do update set price_cents = excluded.price_cents, inventory_qty = excluded.inventory_qty, updated_at = now();
insert into public.product_variant_option_values (variant_id, option_value_id) values
  ('ac200000-0000-4000-8000-000000000001', 'ab200000-0000-4000-8000-000000000001'),
  ('ac200000-0000-4000-8000-000000000002', 'ab200000-0000-4000-8000-000000000002'),
  ('ac200000-0000-4000-8000-000000000003', 'ab200000-0000-4000-8000-000000000003'),
  ('ac300000-0000-4000-8000-000000000001', 'ab300000-0000-4000-8000-000000000001'),
  ('ac300000-0000-4000-8000-000000000002', 'ab300000-0000-4000-8000-000000000002')
on conflict do nothing;

insert into public.discounts (id, store_id, name, discount_type, value, status, minimum_order_cents, usage_limit) values
  ('e2000000-0000-4000-8000-000000000001', '1001', 'Northstar welcome 10%', 'percent', 10, 'active', 5000, 200),
  ('e3000000-0000-4000-8000-000000000001', '1002', 'Hearth welcome $8', 'amount', 800, 'active', 6000, 200)
on conflict do nothing;
insert into public.coupons (store_id, discount_id, code, status, usage_limit) values
  ('1001', 'e2000000-0000-4000-8000-000000000001', 'NORTH10', 'active', 200),
  ('1002', 'e3000000-0000-4000-8000-000000000001', 'HEARTH8', 'active', 200)
on conflict (store_id, code) do nothing;

-- Demo customers are store-scoped. Auth users and passwords are intentionally
-- not inserted by SQL; create them through Supabase Auth, then add memberships.
insert into public.customers (id, store_id, email, first_name, last_name, status, accepts_marketing) values
  ('b2000000-0000-4000-8000-000000000001', '1001', 'ava@northstar-demo.test', 'Ava', 'Morgan', 'active', true),
  ('b2000000-0000-4000-8000-000000000002', '1001', 'leo@northstar-demo.test', 'Leo', 'Martin', 'active', false),
  ('b3000000-0000-4000-8000-000000000001', '1002', 'maya@hearth-demo.test', 'Maya', 'Reed', 'active', true),
  ('b3000000-0000-4000-8000-000000000002', '1002', 'noah@hearth-demo.test', 'Noah', 'Ellis', 'active', false)
on conflict (id) do update set email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name;

insert into public.customer_addresses (customer_id, address_type, first_name, last_name, address_line_1, city, state, postal_code, country, is_default_shipping) values
  ('b2000000-0000-4000-8000-000000000001', 'shipping', 'Ava', 'Morgan', '18 Orchard Street', 'Brooklyn', 'NY', '11201', 'US', true),
  ('b3000000-0000-4000-8000-000000000001', 'shipping', 'Maya', 'Reed', '701 Lakeview Avenue', 'Chicago', 'IL', '60601', 'US', true)
on conflict do nothing;

-- Post-migration isolation checks: every result must be zero.
-- select count(*) from public.products p join public.categories c on p.store_id <> c.store_id join public.product_categories pc on pc.product_id = p.id and pc.category_id = c.id;
-- select count(*) from public.orders o join public.customers c on o.customer_id = c.id where o.store_id <> c.store_id;
