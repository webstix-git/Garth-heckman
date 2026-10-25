-- Allow an authenticated user to read only their own active membership.
-- This lets middleware and login authorization use database membership instead
-- of an environment email allowlist.
drop policy if exists store_memberships_self_read on public.store_memberships;
create policy store_memberships_self_read on public.store_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) and status = 'active');
