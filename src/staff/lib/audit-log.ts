import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminContext } from "@/staff/lib/require-admin-context";

export async function recordAuditEvent(
  context: AdminContext,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    store_id: context.storeId,
    actor_user_id: context.userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    metadata,
  });
  if (error) console.error("audit_log_write_failed", error.message);
}

