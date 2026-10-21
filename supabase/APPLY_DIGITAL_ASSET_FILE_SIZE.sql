-- Apply on remote if migrations are not auto-run:
-- Real byte size for digital download files.
alter table public.digital_assets
  add column if not exists file_size_bytes bigint;
