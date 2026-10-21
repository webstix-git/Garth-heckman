-- Soft-delete (trash) for products and categories. Purged after 30 days by the app.

alter table public.products
  add column if not exists deleted_at timestamptz;

alter table public.categories
  add column if not exists deleted_at timestamptz;

create index if not exists products_store_deleted_at_idx
  on public.products (store_id, deleted_at);

create index if not exists categories_store_deleted_at_idx
  on public.categories (store_id, deleted_at);

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
