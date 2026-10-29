import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatusFallback } from "@/components/OrderStatusFallback";
import { OrderStatusView } from "@/components/OrderStatusView";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<OrderStatusFallback />}>
      <OrderStatusView mode="confirmation" />
    </Suspense>
  );
}
