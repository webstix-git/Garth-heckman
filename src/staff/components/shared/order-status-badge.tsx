import { StatusBadge } from "@/components/shared/status-badge";
import type { OrderStatus } from "@/types";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  return <StatusBadge status={status} />;
}
