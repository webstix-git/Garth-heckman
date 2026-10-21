-- Apply YouTube Shorts tables (safe to re-run)

create table if not exists public.youtube_shorts_categories (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.youtube_shorts (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  title text not null,
  slug text not null,
  content text not null default '',
  excerpt text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  category_id uuid references public.youtube_shorts_categories(id) on delete set null,
  tags text[] not null default '{}',
  youtube_url text not null default '',
  youtube_video_id text not null default '',
  cover_media_id uuid references public.media(id) on delete set null,
  featured_image text not null default '',
  published_at timestamptz,
  views integer not null default 0,
  comments integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index if not exists youtube_shorts_store_id_idx on public.youtube_shorts(store_id);
create index if not exists youtube_shorts_category_id_idx on public.youtube_shorts(category_id);
create index if not exists youtube_shorts_status_idx on public.youtube_shorts(status);
create index if not exists youtube_shorts_deleted_at_idx on public.youtube_shorts(deleted_at);
