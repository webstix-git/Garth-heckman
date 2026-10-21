-- Align products.product_type with platform types including printify.
alter table public.products
  drop constraint if exists products_product_type_check;

alter table public.products
  add constraint products_product_type_check
  check (product_type in (
    'simple', 'variable',
    'physical', 'printify', 'digital', 'virtual', 'service',
    'external', 'bundle', 'subscription', 'pwyw'
  ));
