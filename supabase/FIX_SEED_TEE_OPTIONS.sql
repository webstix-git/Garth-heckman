-- Run this ONLY if Phase A mostly succeeded and failed on invalid UUIDs.
-- Completes tee options + variants seed.

-- Tee options + a couple of variants (full matrix can be synced later)
insert into public.product_options (id, product_id, name, display_type, position)
values
  ('aa100000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000005', 'Color', 'swatch', 0),
  ('aa100000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000005', 'Size', 'button', 1)
on conflict do nothing;

insert into public.product_option_values (id, product_option_id, value, display_label, position)
values
  ('ab100000-0000-4000-8000-000000000001', 'aa100000-0000-4000-8000-000000000001', 'black', 'Black', 0),
  ('ab100000-0000-4000-8000-000000000002', 'aa100000-0000-4000-8000-000000000002', 'm', 'M', 0),
  ('ab100000-0000-4000-8000-000000000003', 'aa100000-0000-4000-8000-000000000002', 'l', 'L', 1)
on conflict do nothing;

insert into public.product_variants (
  id, store_id, product_id, title, sku, price_cents, inventory_qty, status, position
) values
(
  'ac100000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000005',
  'Black / M', 'WTFU-TEE-BLK-M', 3200, 25, 'active', 0
),
(
  'ac100000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000005',
  'Black / L', 'WTFU-TEE-BLK-L', 3200, 25, 'active', 1
)
on conflict (store_id, sku) do update set price_cents = excluded.price_cents, updated_at = now();

insert into public.product_variant_option_values (variant_id, option_value_id)
values
  ('ac100000-0000-4000-8000-000000000001', 'ab100000-0000-4000-8000-000000000001'),
  ('ac100000-0000-4000-8000-000000000001', 'ab100000-0000-4000-8000-000000000002'),
  ('ac100000-0000-4000-8000-000000000002', 'ab100000-0000-4000-8000-000000000001'),
  ('ac100000-0000-4000-8000-000000000002', 'ab100000-0000-4000-8000-000000000003')
on conflict do nothing;
