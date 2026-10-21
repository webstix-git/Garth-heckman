-- Short 4-digit store ids (text), default Garth store = 0001.

drop policy if exists stores_member_all on public.stores;
drop policy if exists products_member_all on public.products;
drop policy if exists variants_member_all on public.product_variants;
drop policy if exists categories_member_all on public.categories;
drop policy if exists orders_member_all on public.orders;
drop policy if exists order_items_member_select on public.order_items;
drop policy if exists customers_member_all on public.customers;
drop policy if exists carts_member_all on public.carts;
drop policy if exists blog_posts_member_all on public.blog_posts;
drop policy if exists media_member_all on public.media;

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and (
        qual ilike '%is_store_member%'
        or with_check ilike '%is_store_member%'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  end loop;
end $$;

drop function if exists public.is_store_member(uuid);

drop view if exists public.orders_legacy cascade;

do $$
declare
  r record;
begin
  for r in
    select distinct dependent_ns.nspname as schema_name, dependent_view.relname as view_name
    from pg_depend
    join pg_rewrite on pg_depend.objid = pg_rewrite.oid
    join pg_class as dependent_view on pg_rewrite.ev_class = dependent_view.oid
    join pg_class as source_table on pg_depend.refobjid = source_table.oid
    join pg_attribute on pg_depend.refobjid = pg_attribute.attrelid
      and pg_depend.refobjsubid = pg_attribute.attnum
    join pg_namespace dependent_ns on dependent_ns.oid = dependent_view.relnamespace
    join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
    where source_ns.nspname = 'public'
      and dependent_view.relkind = 'v'
      and (
        (source_table.relname = 'stores' and pg_attribute.attname = 'id')
        or pg_attribute.attname = 'store_id'
      )
  loop
    execute format('drop view if exists %I.%I cascade', r.schema_name, r.view_name);
  end loop;
end $$;

do $$
declare
  r record;
begin
  for r in
    select con.conname, rel.relname as table_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where con.contype = 'f'
      and nsp.nspname = 'public'
      and con.confrelid = 'public.stores'::regclass
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.table_name, r.conname);
  end loop;
end $$;

alter table public.stores
  alter column id type text using id::text;

do $$
declare
  r record;
begin
  for r in
    select table_schema, table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'store_id'
      and udt_name = 'uuid'
  loop
    execute format(
      'alter table %I.%I alter column %I type text using %I::text',
      r.table_schema, r.table_name, r.column_name, r.column_name
    );
  end loop;
end $$;

update public.stores
set id = '0001'
where id = 'b0000000-0000-4000-8000-000000000001';

do $$
declare
  r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'store_id'
  loop
    execute format(
      'update %I.%I set store_id = %L where store_id = %L',
      r.table_schema,
      r.table_name,
      '0001',
      'b0000000-0000-4000-8000-000000000001'
    );
  end loop;
end $$;

update public.media
set storage_path = regexp_replace(
  storage_path,
  '^b0000000-0000-4000-8000-000000000001/',
  '0001/'
)
where storage_path like 'b0000000-0000-4000-8000-000000000001/%';

do $$
declare
  r record;
  fk_name text;
begin
  for r in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'store_id'
  loop
    fk_name := r.table_name || '_store_id_fkey';
    begin
      execute format(
        'alter table public.%I add constraint %I foreign key (store_id) references public.stores (id) on delete cascade',
        r.table_name,
        fk_name
      );
    exception
      when duplicate_object then null;
      when others then
        raise notice 'Could not add FK on %.store_id: %', r.table_name, SQLERRM;
    end;
  end loop;
end $$;

create or replace function public.is_store_member(p_store_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.store_memberships m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

revoke all on function public.is_store_member(text) from public;
grant execute on function public.is_store_member(text) to authenticated;

create policy stores_member_all on public.stores
  for all to authenticated
  using (public.is_store_member(id))
  with check (public.is_store_member(id));

create policy products_member_all on public.products
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy variants_member_all on public.product_variants
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy categories_member_all on public.categories
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy orders_member_all on public.orders
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy order_items_member_select on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.is_store_member(o.store_id)
    )
  );

create policy customers_member_all on public.customers
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy carts_member_all on public.carts
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy blog_posts_member_all on public.blog_posts
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy media_member_all on public.media
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

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

grant select on public.orders_legacy to anon, authenticated;
