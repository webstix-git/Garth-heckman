-- Platform security foundation: explicit auditability, permissions, and safe tenant joins.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  store_id text references public.stores(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) between 2 and 120),
  resource_type text not null check (length(trim(resource_type)) between 2 and 80),
  resource_id text,
  request_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_store_created_idx on public.audit_logs(store_id, created_at desc);
create index if not exists audit_logs_actor_created_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_super_admin_read on public.audit_logs;
create policy audit_logs_super_admin_read on public.audit_logs for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

drop policy if exists audit_logs_member_read on public.audit_logs;
create policy audit_logs_member_read on public.audit_logs for select to authenticated
  using (store_id is not null and public.is_store_member(store_id));

create or replace function public.write_audit_log(
  p_store_id text,
  p_action text,
  p_resource_type text,
  p_resource_id text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare new_id uuid;
begin
  insert into public.audit_logs(store_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (p_store_id, auth.uid(), p_action, p_resource_type, p_resource_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.write_audit_log(text, text, text, text, jsonb) from public;
grant execute on function public.write_audit_log(text, text, text, text, jsonb) to authenticated;

-- Prevent privileged writes from silently connecting records belonging to different stores.
create or replace function public.reject_cross_store_product_link() returns trigger
language plpgsql set search_path = public
as $$
declare parent_store text; child_store text;
begin
  if tg_table_name = 'product_categories' then
    select store_id into child_store from public.products where id = new.product_id;
    select store_id into parent_store from public.categories where id = new.category_id;
  elsif tg_table_name = 'product_tags' then
    select store_id into child_store from public.products where id = new.product_id;
    select store_id into parent_store from public.tags where id = new.tag_id;
  elsif tg_table_name = 'collection_products' then
    select store_id into child_store from public.products where id = new.product_id;
    select store_id into parent_store from public.collections where id = new.collection_id;
  else
    return new;
  end if;
  if child_store is null or parent_store is null or child_store <> parent_store then
    raise exception 'Cross-store relationship rejected';
  end if;
  return new;
end;
$$;

drop trigger if exists product_categories_store_guard on public.product_categories;
create trigger product_categories_store_guard before insert or update on public.product_categories for each row execute function public.reject_cross_store_product_link();
drop trigger if exists product_tags_store_guard on public.product_tags;
create trigger product_tags_store_guard before insert or update on public.product_tags for each row execute function public.reject_cross_store_product_link();
drop trigger if exists collection_products_store_guard on public.collection_products;
create trigger collection_products_store_guard before insert or update on public.collection_products for each row execute function public.reject_cross_store_product_link();

-- Keep service-role-only operational tables out of anonymous/client access.
revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

