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
