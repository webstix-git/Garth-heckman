-- Standardize system-controlled product kinds.
-- Variant structure is stored separately in metadata.hasVariants and product_options /
-- product_variants; it is not a product kind.

-- Preserve the distinction for legacy rows before removing non-standard kinds.
update public.products
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{hasVariants}', 'true'::jsonb, true)
where product_type in ('variable', 'virtual')
   or coalesce(metadata->>'admin_type', '') in ('variable', 'virtual');

-- Normalize values that were previously used as product types.
update public.products
set
  product_type = case product_type
    when 'simple' then 'physical'
    when 'variable' then 'physical'
    when 'virtual' then 'physical'
    when 'printify' then 'physical'
    when 'pwyw' then 'digital'
    when 'subscription' then 'service'
    else product_type
  end,
  fulfillment = case
    when product_type = 'printify' then 'printify'
    when product_type in ('digital', 'pwyw') then 'download'
    else fulfillment
  end,
  metadata = jsonb_set(
    jsonb_set(
      coalesce(metadata, '{}'::jsonb),
      '{admin_type}',
      to_jsonb(case product_type
        when 'simple' then 'physical'
        when 'variable' then 'physical'
        when 'virtual' then 'physical'
        when 'printify' then 'physical'
        when 'pwyw' then 'digital'
        when 'subscription' then 'service'
        else product_type
      end),
      true
    ),
    '{legacy_product_type}',
    to_jsonb(product_type),
    true
  ),
  updated_at = now()
where product_type in ('simple', 'variable', 'virtual', 'printify', 'pwyw', 'subscription')
   or coalesce(metadata->>'admin_type', '') in ('simple', 'variable', 'virtual', 'printify', 'pwyw', 'subscription');

alter table public.products
  drop constraint if exists products_product_type_check;

alter table public.products
  add constraint products_product_type_check
  check (product_type in (
    'physical', 'digital', 'service', 'bundle', 'gift_card', 'external'
  ));
