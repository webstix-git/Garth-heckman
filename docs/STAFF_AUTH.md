# Staff admin auth (Supabase)

Admin login uses **Supabase Auth** (email + password), not local NextAuth credentials.

## 1. Create the admin user

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Users** → **Add user**:

- Email: same as `AUTH_ADMIN_EMAIL` in `.env.local` (e.g. `admin@garthheckman.com`)
- Password: choose a strong password (8+ chars)
- Auto Confirm User: **on**

Or from the project root:

```bash
# .env.local must include AUTH_ADMIN_EMAIL + AUTH_ADMIN_PASSWORD (8+)
# and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
node scripts/create-admin-user.mjs
```

## 2. Allowlist

`.env.local`:

```bash
AUTH_ADMIN_EMAIL=admin@garthheckman.com
AUTH_ADMIN_EMAILS=admin@garthheckman.com
```

Only allowlisted emails (or users with `app_metadata.role = admin`) can open `/dashboard`.

## 3. Sign in

1. `npm run dev`
2. Open http://localhost:3000/login
3. Use the Supabase email + password

Protected routes: `/account`, `/admin`, `/dashboard`, `/orders`, `/products`, …
