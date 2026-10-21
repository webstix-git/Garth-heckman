#!/usr/bin/env node
/**
 * Create (or update) the store admin user in Supabase Auth.
 *
 * Usage:
 *   node scripts/create-admin-user.mjs
 *
 * Reads from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   AUTH_ADMIN_EMAIL
 *   AUTH_ADMIN_PASSWORD  (required for this script)
 *   AUTH_ADMIN_NAME
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = (process.env.AUTH_ADMIN_EMAIL || "admin@garthheckman.com").toLowerCase();
const password = process.env.AUTH_ADMIN_PASSWORD;
const name = process.env.AUTH_ADMIN_NAME || "Garth Admin";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set AUTH_ADMIN_PASSWORD in .env.local (min 8 characters)");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = listed.users.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name, username: email.split("@")[0], role: "admin" },
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log(`Updated admin user: ${email}`);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username: email.split("@")[0], role: "admin" },
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log(`Created admin user: ${email}`);
  }

  console.log("Sign in at http://localhost:3000/login");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
