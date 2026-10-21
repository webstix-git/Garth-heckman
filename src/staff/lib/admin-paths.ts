/** Base path for all dashboard (admin portal) pages. */
export const ADMIN_BASE = "/admin";

export function adminPath(path = ""): string {
  if (!path || path === "/") return ADMIN_BASE;
  return `${ADMIN_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
