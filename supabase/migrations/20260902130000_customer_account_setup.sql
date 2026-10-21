-- Customer accounts are optional. Every checkout creates a customer; this table
-- stores a short-lived, one-time token for the customer to choose a password.

create table if not exists public.customer_account_setup_tokens (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_account_setup_tokens_customer_idx
  on public.customer_account_setup_tokens (customer_id, expires_at desc)
  where used_at is null;

-- A shopper is unique within a store by their normalized email address.
create unique index if not exists customers_store_email_unique_idx
  on public.customers (store_id, lower(email))
  where email is not null;
