-- Convert legacy pay-what-you-want product_type → digital download.
-- Donation pricing (pwyw_* cents) can remain on digital rows.

update public.products
set
  product_type = 'digital',
  fulfillment = 'download',
  requires_shipping = false,
  track_inventory = false,
  price_cents = coalesce(price_cents, pwyw_suggested_cents, pwyw_min_cents, 1000),
  metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{admin_type}',
    '"digital"'::jsonb,
    true
  ),
  updated_at = now()
where store_id = '0001'
  and (
    product_type = 'pwyw'
    or coalesce(metadata->>'admin_type', '') = 'pwyw'
    or slug in ('wtfu-book', 'wtfu-audiobook')
  );

-- Paste into Supabase SQL Editor once, then reload admin products.
