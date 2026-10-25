import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";

function isAdminLogin(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

/** All dashboard pages live under /admin (except the login screen). */
function isAdminAppPath(pathname: string) {
  if (isAdminLogin(pathname)) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isStaffApiPath(pathname: string) {
  return pathname === "/api/staff" || pathname.startsWith("/api/staff/");
}

/**
 * Refresh Supabase auth cookies. Gate staff admin routes behind a real session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const adminOk = Boolean(user && isAdminUser(user));

  if (isStaffApiPath(pathname) && !adminOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminAppPath(pathname) && !adminOk) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminLogin(pathname) && adminOk) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/admin/dashboard";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  return supabaseResponse;
}
