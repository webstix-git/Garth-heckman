-- Soft-delete support for blog posts (matches products/categories trash)

alter table public.blog_posts
  add column if not exists deleted_at timestamptz;

create index if not exists blog_posts_store_deleted_at_idx
  on public.blog_posts (store_id, deleted_at);

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
