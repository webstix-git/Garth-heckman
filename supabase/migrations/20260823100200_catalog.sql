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
      'simple', 'variable', 'digital', 'pwyw',
      'physical', 'virtual', 'service', 'external', 'bundle'
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
