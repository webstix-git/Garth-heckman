-- Sync seeded product prices with the live storefront (catalog-source.js).
-- Store id is short code 0001 after APPLY_STORE_ID_0001.sql.

update public.products
set
  price_cents = 3699,
  product_type = 'printify',
  fulfillment = 'printify',
  updated_at = now()
where store_id = '0001' and slug = 'wtfu-tee';

update public.products
set
  price_cents = 1299,
  product_type = 'printify',
  fulfillment = 'printify',
  updated_at = now()
where store_id = '0001' and slug = 'wtfu-mug';

update public.products
set
  price_cents = 1699,
  product_type = 'printify',
  fulfillment = 'printify',
  updated_at = now()
where store_id = '0001' and slug = 'wtfu-journal';

update public.products
set
  price_cents = 500,
  updated_at = now()
where store_id = '0001' and slug = 'burn-this-book';

update public.products
set
  price_cents = 0,
  updated_at = now()
where store_id = '0001' and slug = 'generations-training-deck';

-- PWYW suggested amounts (website)
update public.products
set
  pwyw_suggested_cents = 1000,
  pwyw_min_cents = 1000,
  updated_at = now()
where store_id = '0001' and slug = 'wtfu-book';

update public.products
set
  pwyw_suggested_cents = 1000,
  pwyw_min_cents = 100,
  updated_at = now()
where store_id = '0001' and slug = 'wtfu-audiobook';

-- Tee variant prices closer to live catalog (Black/M & Black/L were $32 seed)
update public.product_variants
set
  price_cents = 3399,
  updated_at = now()
where store_id = '0001'
  and product_id = 'f1000000-0000-4000-8000-000000000005';
