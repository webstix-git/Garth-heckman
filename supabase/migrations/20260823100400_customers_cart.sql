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
