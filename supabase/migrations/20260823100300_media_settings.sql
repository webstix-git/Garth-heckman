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
