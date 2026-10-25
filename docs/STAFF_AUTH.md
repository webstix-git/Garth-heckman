# Staff admin auth (Supabase)

Admin login uses **Supabase Auth** (email + password), not local NextAuth credentials.

## 1. Create the admin user

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Users** → **Add user**:

- Email: the Supabase Auth user's email
- Password: choose a strong password (8+ chars)
- Auto Confirm User: **on**

Or from the project root:

```bash
# .env.local must include AUTH_ADMIN_PASSWORD (8+)
# and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
node scripts/create-admin-user.mjs user@example.com
```

## 2. Assign database membership

In Supabase, add an active row to `public.store_memberships` for the Auth user's
UUID and the store they should manage. The frontend authorizes admin access from
this active database membership. Platform-level users may instead use the
Supabase Auth `app_metadata.role` value `admin` or `super_admin`.

There is no email allowlist in the frontend.

## 3. Sign in

1. `npm run dev`
2. Open http://localhost:3000/login
3. Use the Supabase email + password

Protected routes: `/account`, `/admin`, `/dashboard`, `/orders`, `/products`, …
