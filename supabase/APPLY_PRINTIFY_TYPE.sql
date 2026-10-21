-- Printify is a fulfillment provider, not a product type.

alter table public.products
  drop constraint if exists products_product_type_check;

-- Tee / mug / journal (and any fulfillment=printify rows) → physical product
update public.products
set
  product_type = 'physical',
  fulfillment = 'printify',
  requires_shipping = true,
  metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{admin_type}',
    '"physical"'::jsonb,
    true
  ),
  updated_at = now()
where store_id = '0001'
  and (
    slug in ('wtfu-tee', 'wtfu-mug', 'wtfu-journal')
    or fulfillment = 'printify'
    or coalesce(metadata->>'admin_type', '') in ('Branded Merchandise', 'variable')
  );

alter table public.products
  add constraint products_product_type_check
  check (product_type in ('physical', 'digital', 'service', 'bundle', 'gift_card', 'external'));

-- Paste into Supabase SQL Editor once, then reload /products?type=printify
