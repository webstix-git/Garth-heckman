-- Standard platform product kinds. Variant structure is modeled separately.

alter table public.products
  drop constraint if exists products_product_type_check;

-- Map legacy Garth-specific types → platform types
update public.products
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{hasVariants}', 'true'::jsonb, true)
where store_id = '0001'
  and (
    product_type in ('variable', 'virtual')
    or coalesce(metadata->>'admin_type', '') in ('variable', 'virtual')
  );

update public.products
set product_type = case product_type
  when 'simple' then 'physical'
  when 'variable' then 'physical'
  when 'virtual' then 'physical'
  when 'printify' then 'physical'
  when 'pwyw' then 'digital'
  when 'subscription' then 'service'
  else product_type
end,
metadata = jsonb_set(
  coalesce(metadata, '{}'::jsonb),
  '{admin_type}',
  to_jsonb(
    case coalesce(metadata->>'admin_type', product_type)
      when 'WTFU Book' then 'digital'
      when 'Audio Book' then 'digital'
      when 'Burn This Book PDF' then 'digital'
      when 'Generations Training Deck' then 'digital'
      when 'Branded Merchandise' then 'physical'
      when 'simple' then 'physical'
      when 'variable' then 'physical'
      when 'virtual' then 'physical'
      when 'printify' then 'physical'
      when 'pwyw' then 'digital'
      when 'subscription' then 'service'
      else coalesce(metadata->>'admin_type', product_type)
    end
  ),
  true
)
where store_id = '0001';

update public.products
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{hasVariants}', 'true'::jsonb, true)
where store_id = '0001'
  and coalesce(metadata->>'legacy_product_type', metadata->>'admin_type', '') in ('variable', 'virtual');

update public.products
set
  product_type = 'physical',
  fulfillment = 'printify',
  requires_shipping = true,
  updated_at = now()
where store_id = '0001'
  and slug in ('wtfu-tee', 'wtfu-mug', 'wtfu-journal');

alter table public.products
  add constraint products_product_type_check
  check (product_type in ('physical', 'digital', 'service', 'bundle', 'gift_card', 'external'));

-- Paste into Supabase SQL Editor once, then reload /products.
