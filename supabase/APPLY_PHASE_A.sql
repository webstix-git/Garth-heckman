-- Garth Heckman Phase A — ONE-SHOT apply
-- Project: cnsmezewkpgqkhuvwfts
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT
-- Regenerated: 2026-08-23T16:01:26Z


-- ========== 20260823100000_extensions.sql ==========

-- Phase A — extensions
-- Garth Heckman / Webstix commerce base (integer cents, multi-tenant ready)

create extension if not exists "pgcrypto";


-- ========== 20260823100100_tenancy.sql ==========

-- Phase A — tenancy + light authorization
-- Account → Store (seed one Garth store). Memberships link auth.users later.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id),
  name text not null,
  slug text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  currency text not null default 'USD',
  timezone text not null default 'America/Chicago',
  default_locale text not null default 'en-US',
  default_country_code text default 'US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, slug)
);

create index if not exists stores_account_id_idx on public.stores (account_id);

create table if not exists public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role_key text not null default 'store_admin'
    check (role_key in (
      'account_owner', 'store_admin', 'store_manager',
      'catalog_manager', 'order_manager', 'fulfillment_manager',
      'customer_support', 'content_editor'
    )),
  status text not null default 'active'
    check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index if not exists store_memberships_user_id_idx
  on public.store_memberships (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists store_memberships_set_updated_at on public.store_memberships;
create trigger store_memberships_set_updated_at
  before update on public.store_memberships
  for each row execute function public.set_updated_at();

-- Helper: is the current auth user a member of this store?
create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.store_memberships m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;


-- ========== 20260823100200_catalog.sql ==========

-- Phase A — catalog (products, variants, options, taxonomy)
-- Money lives in bigint cents on products/variants (price lists can come later).

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'hidden', 'archived')),
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index if not exists categories_store_parent_idx
  on public.categories (store_id, parent_id);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  collection_type text not null default 'manual'
    check (collection_type in ('manual', 'smart')),
  status text not null default 'active'
    check (status in ('active', 'hidden', 'archived')),
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  product_type text not null
    check (product_type in (
      'physical', 'digital', 'service', 'bundle', 'gift_card', 'external'
    )),
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived', 'coming-soon')),
  visibility text not null default 'visible'
    check (visibility in ('visible', 'hidden', 'catalog_only', 'search_only')),
  description text,
  short_description text,
  sku text,
  fulfillment text not null default 'self'
    check (fulfillment in ('self', 'printify', 'download')),
  -- cents
  price_cents bigint check (price_cents is null or price_cents >= 0),
  compare_at_cents bigint check (compare_at_cents is null or compare_at_cents >= 0),
  pwyw_min_cents bigint check (pwyw_min_cents is null or pwyw_min_cents >= 0),
  pwyw_max_cents bigint check (pwyw_max_cents is null or pwyw_max_cents >= 0),
  pwyw_suggested_cents bigint check (pwyw_suggested_cents is null or pwyw_suggested_cents >= 0),
  track_inventory boolean not null default true,
  requires_shipping boolean not null default true,
  is_taxable boolean not null default true,
  allow_backorder boolean not null default false,
  inventory_qty int,
  printify_product_id text,
  printify_variant_id bigint,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index if not exists products_store_status_idx
  on public.products (store_id, status);
create index if not exists products_store_published_idx
  on public.products (store_id, published_at desc);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  display_type text not null default 'button'
    check (display_type in ('button', 'swatch', 'select')),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  product_option_id uuid not null references public.product_options (id) on delete cascade,
  value text not null,
  display_label text,
  hex text,
  position int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  title text,
  sku text not null,
  price_cents bigint not null check (price_cents >= 0),
  compare_at_cents bigint check (compare_at_cents is null or compare_at_cents >= 0),
  inventory_qty int not null default 0,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  position int not null default 0,
  requires_shipping boolean not null default true,
  taxable boolean not null default true,
  printify_variant_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sku)
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create table if not exists public.product_variant_option_values (
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  option_value_id uuid not null references public.product_option_values (id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  position int not null default 0,
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_id_idx
  on public.product_categories (category_id, product_id);

create table if not exists public.product_tags (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  position int not null default 0,
  primary key (collection_id, product_id)
);

create table if not exists public.related_products (
  product_id uuid not null references public.products (id) on delete cascade,
  related_product_id uuid not null references public.products (id) on delete cascade,
  relation_type text not null default 'related'
    check (relation_type in ('related', 'upsell', 'cross_sell', 'replacement')),
  position int not null default 0,
  primary key (product_id, related_product_id, relation_type),
  check (product_id <> related_product_id)
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();


-- ========== 20260823100300_media_settings.sql ==========

-- Phase A — media library + store settings

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  file_name text not null,
  original_file_name text,
  storage_bucket text not null default 'store-media',
  storage_path text not null,
  public_url text,
  mime_type text not null,
  media_type text not null default 'image'
    check (media_type in ('image', 'video', 'audio', 'document', 'file')),
  file_size bigint not null default 0,
  width int,
  height int,
  alt_text text,
  title text,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_store_created_idx
  on public.media (store_id, created_at desc);

alter table public.products
  add column if not exists featured_media_id uuid references public.media (id) on delete set null;

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  position int not null default 0,
  role text not null default 'gallery'
    check (role in ('gallery', 'video', 'manual', 'featured')),
  alt_text_override text,
  created_at timestamptz not null default now(),
  unique (product_id, media_id)
);

create table if not exists public.product_variant_media (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  position int not null default 0,
  role text not null default 'gallery',
  created_at timestamptz not null default now(),
  unique (variant_id, media_id)
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores (id) on delete cascade,
  general jsonb not null default '{}'::jsonb,
  localization jsonb not null default '{}'::jsonb,
  checkout jsonb not null default '{}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  shipping jsonb not null default '{}'::jsonb,
  tax jsonb not null default '{}'::jsonb,
  storefront jsonb not null default '{}'::jsonb,
  catalog jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists media_set_updated_at on public.media;
create trigger media_set_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();


-- ========== 20260823100400_customers_cart.sql ==========

-- Phase A — customers, carts, coupons

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'blocked', 'archived')),
  accepts_marketing boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_store_email_idx
  on public.customers (store_id, email);

create table if not exists public.customer_auth_links (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  address_type text not null default 'shipping'
    check (address_type in ('shipping', 'billing')),
  first_name text,
  last_name text,
  company text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  discount_type text not null
    check (discount_type in ('percent', 'amount', 'shipping')),
  value bigint not null check (value >= 0), -- percent points or cents
  status text not null default 'active'
    check (status in ('active', 'scheduled', 'expired', 'disabled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  minimum_order_cents bigint,
  maximum_discount_cents bigint,
  usage_limit int,
  customer_usage_limit int,
  stackable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  discount_id uuid not null references public.discounts (id) on delete cascade,
  code text not null,
  status text not null default 'active'
    check (status in ('active', 'disabled', 'expired')),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int,
  created_at timestamptz not null default now(),
  unique (store_id, code)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  session_id text,
  status text not null default 'active'
    check (status in ('active', 'abandoned', 'converted', 'expired')),
  currency text not null default 'USD',
  email text,
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  discount_total_cents bigint not null default 0 check (discount_total_cents >= 0),
  shipping_total_cents bigint not null default 0 check (shipping_total_cents >= 0),
  tax_total_cents bigint not null default 0 check (tax_total_cents >= 0),
  grand_total_cents bigint not null default 0 check (grand_total_cents >= 0),
  last_activity_at timestamptz default now(),
  expires_at timestamptz,
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_store_status_idx on public.carts (store_id, status);
create index if not exists carts_session_id_idx on public.carts (session_id, status);
create index if not exists carts_customer_id_idx on public.carts (customer_id, status);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id),
  variant_id uuid references public.product_variants (id),
  quantity int not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0), -- claim only
  pwyw_cents bigint check (pwyw_cents is null or pwyw_cents >= 0),
  line_total_cents bigint not null check (line_total_cents >= 0),
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);

create table if not exists public.cart_discounts (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  discount_id uuid references public.discounts (id) on delete set null,
  coupon_id uuid references public.coupons (id) on delete set null,
  code text,
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();


-- ========== 20260823100500_orders_payments.sql ==========

-- Phase A — orders, payments, digital entitlements, ops

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id),
  customer_id uuid references public.customers (id) on delete set null,
  cart_id uuid references public.carts (id) on delete set null,
  order_number text not null,
  order_status text not null default 'pending'
    check (order_status in ('pending', 'processing', 'completed', 'cancelled', 'closed', 'sample')),
  payment_status text not null default 'pending'
    check (payment_status in (
      'pending', 'authorized', 'paid', 'partially_refunded',
      'refunded', 'failed', 'voided', 'none'
    )),
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in (
      'unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned'
    )),
  currency text not null default 'USD',
  customer_email text not null,
  customer_name text not null,
  subtotal_cents bigint not null check (subtotal_cents >= 0),
  discount_total_cents bigint not null default 0 check (discount_total_cents >= 0),
  shipping_total_cents bigint not null default 0 check (shipping_total_cents >= 0),
  tax_total_cents bigint not null default 0 check (tax_total_cents >= 0),
  refund_total_cents bigint not null default 0 check (refund_total_cents >= 0),
  grand_total_cents bigint not null check (grand_total_cents >= 0),
  payment_method text not null default 'none',
  printify_order_id text,
  source text default 'storefront',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, order_number)
);

create index if not exists orders_store_placed_idx
  on public.orders (store_id, placed_at desc);
create index if not exists orders_store_email_idx
  on public.orders (store_id, customer_email);
create index if not exists orders_customer_id_idx
  on public.orders (customer_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  sku_snapshot text,
  quantity int not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  discount_total_cents bigint not null default 0,
  tax_total_cents bigint not null default 0,
  line_subtotal_cents bigint not null check (line_subtotal_cents >= 0),
  line_total_cents bigint not null check (line_total_cents >= 0),
  requires_shipping boolean not null default false,
  product_type text,
  printify_product_id text,
  printify_variant_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  address_type text not null check (address_type in ('shipping', 'billing')),
  first_name text,
  last_name text,
  company text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'paypal',
  provider_payment_id text,
  status text not null default 'pending'
    check (status in (
      'pending', 'authorized', 'captured', 'paid',
      'failed', 'voided', 'refunded'
    )),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  transaction_type text not null
    check (transaction_type in ('authorization', 'capture', 'void', 'refund', 'chargeback')),
  provider_transaction_id text,
  amount_cents bigint not null check (amount_cents >= 0),
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  signature text,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'ignored')),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists public.digital_assets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  media_id uuid references public.media (id) on delete set null,
  file_label text,
  storage_bucket text not null default 'protected-digital-assets',
  storage_path text,
  download_limit int,
  expires_after_days int,
  access_type text not null default 'entitlement'
    check (access_type in ('entitlement', 'public_link')),
  created_at timestamptz not null default now()
);

create table if not exists public.download_entitlements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  digital_asset_id uuid not null references public.digital_assets (id),
  download_count int not null default 0,
  max_downloads int,
  expires_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'exhausted', 'expired', 'revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  idempotency_key text not null,
  operation text not null,
  request_hash text not null,
  response_status int,
  response_body jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (store_id, idempotency_key, operation)
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  event_type text not null,
  recipient_type text not null default 'customer',
  recipient_address text,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Point carts.converted_order_id at orders (circular FK deferred)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'carts_converted_order_id_fkey'
  ) then
    alter table public.carts
      add constraint carts_converted_order_id_fkey
      foreign key (converted_order_id) references public.orders (id) on delete set null;
  end if;
end $$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Compatibility view for earlier sample app columns (number, email, name, totals.*)
create or replace view public.orders_legacy
with (security_invoker = true)
as
select
  o.id,
  o.order_number as number,
  o.placed_at,
  o.customer_email as email,
  o.customer_name as name,
  (o.fulfillment_status <> 'unfulfilled' or exists (
    select 1 from public.order_items oi where oi.order_id = o.id and oi.requires_shipping
  )) as shipping_required,
  o.payment_method,
  o.order_status as status,
  o.printify_order_id,
  o.subtotal_cents,
  o.shipping_total_cents as shipping_cents,
  o.tax_total_cents as tax_cents,
  o.grand_total_cents as total_cents,
  o.created_at,
  o.store_id
from public.orders o;


-- ========== 20260823100600_rls.sql ==========

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


-- ========== 20260823100700_seed_garth.sql ==========

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
  'Wake The Faith Up', 'wtfu-book', 'digital', 'active', 'visible',
  'WTFU, Revelation 3:1–3', 'WTFU-BOOK', 'self',
  null, 1000, 50000, 1000,
  false, true, null, true, now(),
  'Wake The Faith Up (WTFU), pay what you want | Garth Heckman',
  'Pay what you want for Wake the Faith Up.'
),
(
  'f1000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000001',
  'Wake The Faith Up (Audiobook)', 'wtfu-audiobook', 'digital', 'active', 'visible',
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
  'WTFU Tee', 'wtfu-tee', 'physical', 'active', 'visible',
  'Heavyweight cotton, front lockup', 'WTFU-TEE', 'printify',
  null, null, null, null,
  true, true, null, true, now(),
  'WTFU Tee | Garth Heckman',
  'Heavyweight cotton tee with the WTFU lockup.'
),
(
  'f1000000-0000-4000-8000-000000000006',
  'b0000000-0000-4000-8000-000000000001',
  'WTFU Mug', 'wtfu-mug', 'physical', 'active', 'visible',
  'Ceramic, dishwasher safe', 'WTFU-MUG', 'printify',
  null, null, null, null,
  true, true, null, false, now(),
  'WTFU Mug | Garth Heckman',
  'Ceramic WTFU mug, 11oz or 15oz.'
),
(
  'f1000000-0000-4000-8000-000000000007',
  'b0000000-0000-4000-8000-000000000001',
  'WTFU Journal', 'wtfu-journal', 'physical', 'active', 'visible',
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

-- Variant structure is independent of product type.
update public.products
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{hasVariants}', 'true'::jsonb, true)
where store_id = 'b0000000-0000-4000-8000-000000000001'
  and slug in ('wtfu-tee', 'wtfu-mug');

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
