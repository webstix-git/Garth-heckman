import type { AdminUser } from "@/types";

/** Map a session-shaped user for UI helpers. */
export function toAdminUser(user: AdminUser): AdminUser {
  return user;
}
