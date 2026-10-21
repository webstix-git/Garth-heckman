import { StatusBadge } from "@/components/shared/status-badge";
import type { PaymentStatus } from "@/types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  return <StatusBadge status={status} />;
}
