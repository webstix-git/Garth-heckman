-- Align products.product_type with Ecommerce_Doc_2 platform types.
alter table public.products
  drop constraint if exists products_product_type_check;

alter table public.products
  add constraint products_product_type_check
  check (product_type in (
    'simple', 'variable',
    'physical', 'digital', 'virtual', 'service',
    'external', 'bundle', 'subscription', 'pwyw'
  ));
