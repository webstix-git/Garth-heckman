-- Blog posts (store-scoped CMS for public /blog + admin dashboard)

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text not null default '',
  content text not null default '',
  featured_image text not null default '',
  author text not null default 'Garth Heckman',
  category text not null default 'Uncategorized',
  tags text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  published_at timestamptz,
  seo jsonb not null default '{}'::jsonb,
  site jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index if not exists blog_posts_store_status_published_idx
  on public.blog_posts (store_id, status, published_at desc nulls last);

create index if not exists blog_posts_store_created_idx
  on public.blog_posts (store_id, created_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists blog_posts_member_all on public.blog_posts;
create policy blog_posts_member_all on public.blog_posts
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
