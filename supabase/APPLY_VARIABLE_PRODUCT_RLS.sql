-- Public read + member write for variable-product option tables.
-- Mirrors product_variants policies from APPLY_PHASE_A.sql.
-- Run in Supabase SQL Editor if options/values aren't readable by anon yet.
-- Staff sync uses the service role and does not depend on these policies.

alter table public.product_options enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variant_option_values enable row level security;

drop policy if exists product_options_public_read on public.product_options;
create policy product_options_public_read on public.product_options
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.status in ('active', 'coming-soon')
        and p.visibility in ('visible', 'catalog_only', 'search_only')
    )
  );

drop policy if exists product_options_member_all on public.product_options;
create policy product_options_member_all on public.product_options
  for all to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.is_store_member(p.store_id)
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.is_store_member(p.store_id)
    )
  );

drop policy if exists product_option_values_public_read on public.product_option_values;
create policy product_option_values_public_read on public.product_option_values
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_options o
      join public.products p on p.id = o.product_id
      where o.id = product_option_id
        and p.status in ('active', 'coming-soon')
        and p.visibility in ('visible', 'catalog_only', 'search_only')
    )
  );

drop policy if exists product_option_values_member_all on public.product_option_values;
create policy product_option_values_member_all on public.product_option_values
  for all to authenticated
  using (
    exists (
      select 1
      from public.product_options o
      join public.products p on p.id = o.product_id
      where o.id = product_option_id
        and public.is_store_member(p.store_id)
    )
  )
  with check (
    exists (
      select 1
      from public.product_options o
      join public.products p on p.id = o.product_id
      where o.id = product_option_id
        and public.is_store_member(p.store_id)
    )
  );

drop policy if exists product_variant_option_values_public_read on public.product_variant_option_values;
create policy product_variant_option_values_public_read on public.product_variant_option_values
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id
        and p.status in ('active', 'coming-soon')
        and p.visibility in ('visible', 'catalog_only', 'search_only')
    )
  );

drop policy if exists product_variant_option_values_member_all on public.product_variant_option_values;
create policy product_variant_option_values_member_all on public.product_variant_option_values
  for all to authenticated
  using (
    exists (
      select 1
      from public.product_variants v
      where v.id = variant_id
        and public.is_store_member(v.store_id)
    )
  )
  with check (
    exists (
      select 1
      from public.product_variants v
      where v.id = variant_id
        and public.is_store_member(v.store_id)
    )
  );
