-- Fix media public URLs / paths still using the old long store UUID.
-- Run after APPLY_STORE_ID_0001.sql

-- 1) storage_path: UUID → 0001
update public.media
set storage_path = regexp_replace(
  storage_path,
  '^b0000000-0000-4000-8000-000000000001/',
  '0001/'
)
where storage_path like 'b0000000-0000-4000-8000-000000000001/%';

-- 2) public_url: rewrite the folder segment in the URL
update public.media
set public_url = replace(
  public_url,
  '/store-media/b0000000-0000-4000-8000-000000000001/',
  '/store-media/0001/'
)
where public_url like '%/store-media/b0000000-0000-4000-8000-000000000001/%';

-- 3) metadata.storeId
update public.media
set metadata = jsonb_set(
  coalesce(metadata, '{}'::jsonb),
  '{storeId}',
  '"0001"'::jsonb,
  true
)
where coalesce(metadata->>'storeId', '') = 'b0000000-0000-4000-8000-000000000001';

-- 4) Also fix any blog/product HTML that embeds the old URL
update public.blog_posts
set
  featured_image = replace(
    featured_image,
    '/store-media/b0000000-0000-4000-8000-000000000001/',
    '/store-media/0001/'
  ),
  content = replace(
    content,
    '/store-media/b0000000-0000-4000-8000-000000000001/',
    '/store-media/0001/'
  )
where featured_image like '%/store-media/b0000000-0000-4000-8000-000000000001/%'
   or content like '%/store-media/b0000000-0000-4000-8000-000000000001/%';

update public.products
set
  description = replace(
    description,
    '/store-media/b0000000-0000-4000-8000-000000000001/',
    '/store-media/0001/'
  ),
  metadata = replace(
    metadata::text,
    '/store-media/b0000000-0000-4000-8000-000000000001/',
    '/store-media/0001/'
  )::jsonb
where description like '%/store-media/b0000000-0000-4000-8000-000000000001/%'
   or metadata::text like '%/store-media/b0000000-0000-4000-8000-000000000001/%';

-- IMPORTANT (Storage UI):
-- Supabase Dashboard → Storage → store-media
-- Rename folder:
--   b0000000-0000-4000-8000-000000000001  →  0001
-- Without renaming the folder, rewritten URLs will 404.
