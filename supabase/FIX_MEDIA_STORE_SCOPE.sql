-- Store-scoped media access (not a shared/common library)
-- Paste into Supabase SQL Editor if you want DB-level staff isolation too.
-- Admin dashboard already filters by NEXT_PUBLIC_STORE_ID in app code.

drop policy if exists media_member_all on public.media;
create policy media_member_all on public.media
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- Keep public read for storefront image URLs, but only public rows.
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media
  for select to anon, authenticated
  using (is_public = true);
