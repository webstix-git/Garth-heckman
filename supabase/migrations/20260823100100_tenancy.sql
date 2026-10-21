-- Phase A — tenancy + light authorization
-- Account → Store (seed one Garth store). Memberships link auth.users later.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id),
  name text not null,
  slug text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  currency text not null default 'USD',
  timezone text not null default 'America/Chicago',
  default_locale text not null default 'en-US',
  default_country_code text default 'US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, slug)
);

create index if not exists stores_account_id_idx on public.stores (account_id);

create table if not exists public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role_key text not null default 'store_admin'
    check (role_key in (
      'account_owner', 'store_admin', 'store_manager',
      'catalog_manager', 'order_manager', 'fulfillment_manager',
      'customer_support', 'content_editor'
    )),
  status text not null default 'active'
    check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index if not exists store_memberships_user_id_idx
  on public.store_memberships (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists store_memberships_set_updated_at on public.store_memberships;
create trigger store_memberships_set_updated_at
  before update on public.store_memberships
  for each row execute function public.set_updated_at();

-- Helper: is the current auth user a member of this store?
create or replace function public.is_store_member(p_store_id uuid)
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

revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;
