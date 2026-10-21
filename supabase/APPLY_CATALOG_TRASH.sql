-- Paste into Supabase SQL Editor once, then reload admin products/categories/blog.

alter table public.products
  add column if not exists deleted_at timestamptz;

alter table public.categories
  add column if not exists deleted_at timestamptz;

alter table public.blog_posts
  add column if not exists deleted_at timestamptz;

create index if not exists products_store_deleted_at_idx
  on public.products (store_id, deleted_at);

create index if not exists categories_store_deleted_at_idx
  on public.categories (store_id, deleted_at);

create index if not exists blog_posts_store_deleted_at_idx
  on public.blog_posts (store_id, deleted_at);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    deleted_at is null
    and status in ('active', 'coming-soon')
    and visibility in ('visible', 'catalog_only', 'search_only')
  );

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
