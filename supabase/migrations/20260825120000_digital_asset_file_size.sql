-- Real byte size for digital download files (storefront “X MB” display).
alter table public.digital_assets
  add column if not exists file_size_bytes bigint;

comment on column public.digital_assets.file_size_bytes is
  'Original file size in bytes; used for storefront download size labels.';
