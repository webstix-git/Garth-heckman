create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, slug)
);
create index if not exists blog_categories_store_idx on public.blog_categories(store_id, deleted_at);

insert into public.blog_categories (store_id, name, slug)
select distinct bp.store_id, bp.category, regexp_replace(lower(trim(bp.category)), '[^a-z0-9]+', '-', 'g')
from public.blog_posts bp
where nullif(trim(bp.category), '') is not null
on conflict (store_id, slug) do nothing;
