-- Optional: seed or update preset attribute values for the product editor.
-- Values are read from store_settings.catalog.attributePresets (merged with code defaults).

update public.store_settings
set catalog = coalesce(catalog, '{}'::jsonb) || jsonb_build_object(
  'attributePresets', jsonb_build_object(
    'Size', jsonb_build_array('XS', 'S', 'M', 'L', 'XL', '2XL'),
    'Color', jsonb_build_array('Black', 'White', 'Navy', 'Sand', 'Forest')
  )
),
updated_at = now()
where store_id = 'b0000000-0000-4000-8000-000000000001';
