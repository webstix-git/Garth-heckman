import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const backendAdminApiPaths = [
  "/api/auth/",
  "/api/admin/",
  "/api/activity",
  "/api/blog",
  "/api/catalog",
  "/api/categories",
  "/api/content/",
  "/api/customers",
  "/api/dashboard",
  "/api/email-activity",
  "/api/inventory",
  "/api/media",
  "/api/notifications",
  "/api/orders",
  "/api/products",
  "/api/shipping",
  "/api/store/",
  "/api/stores",
  "/api/team",
  "/api/roles",
  "/api/support",
  "/api/invoices",
  "/api/reviews",
  "/api/pricing",
];

function backendUrl() {
  return String(process.env.ADMIN_BACKEND_URL || process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
}

function isAdminReferer(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).pathname === "/admin" || new URL(referer).pathname.startsWith("/admin/");
  } catch {
    return false;
  }
}

function isBackendAdminApi(pathname: string) {
  return backendAdminApiPaths.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix));
}

function rewriteToBackend(request: NextRequest, pathname = request.nextUrl.pathname) {
  const origin = backendUrl();
  if (!origin) return null;
  const target = new URL(`${origin}${pathname}${request.nextUrl.search}`);
  return NextResponse.rewrite(target);
}

function isPublicAdminPage(pathname: string) {
  return ["/admin/login", "/admin/forgot-password", "/admin/reset-password", "/admin/verify-otp", "/admin/register", "/admin/lock"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep unauthenticated admin navigation on the frontend origin. The
  // backend remains the authority and will still validate the session.
  if (pathname.startsWith("/admin") && !isPublicAdminPage(pathname) && !request.cookies.get("store-admin-session")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // The backend owns the admin zone and validates its own signed session.
  // Running the legacy Supabase staff gate here bounces backend sessions back
  // to /admin/login.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const rewritten = rewriteToBackend(request);
    if (rewritten) return rewritten;
  }

  // The backend login page posts to /api/auth/session. Authentication requests
  // may not include a Referer header in some browsers, so always proxy the
  // backend auth namespace. Other admin APIs remain scoped to the admin zone
  // so storefront APIs with similar names keep working.
  if (pathname.startsWith("/api/auth/") && isBackendAdminApi(pathname)) {
    const rewritten = rewriteToBackend(request);
    if (rewritten) return rewritten;
  }

  // Backend admin pages use root-relative fetches. Proxy other requests made
  // from the admin zone so the storefront's same-origin APIs keep working.
  if (pathname.startsWith("/api/") && isAdminReferer(request) && isBackendAdminApi(pathname)) {
    const rewritten = rewriteToBackend(request);
    if (rewritten) return rewritten;
  }

  // The backend's Next.js chunks are requested from /_next/static. Route
  // those requests to the backend only when the requesting page is admin.
  if (pathname.startsWith("/_next/static/") && isAdminReferer(request)) {
    const rewritten = rewriteToBackend(request);
    if (rewritten) return rewritten;
  }

  if (isAdminReferer(request) && /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$/i.test(pathname)) {
    const rewritten = rewriteToBackend(request);
    if (rewritten) return rewritten;
  }

  // Some backend admin links still point to root-level pages. Keep public
  // storefront routes public, but keep an admin-origin navigation in /admin.
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/") && isAdminReferer(request)) {
    return NextResponse.redirect(new URL(`/admin${pathname}`, request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Include admin/API/static requests because the backend admin zone needs
     * same-origin proxying. Storefront API handlers still authenticate in the
     * route itself, and admin API requests are forwarded only by admin referrer.
     */
    "/admin/:path*",
    "/api/:path*",
    "/_next/static/:path*",
    "/((?!_next/image|favicon.ico|assets/).*)",
  ],
};
