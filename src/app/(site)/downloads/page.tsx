import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatusFallback } from "@/components/OrderStatusFallback";
import { OrderStatusView } from "@/components/OrderStatusView";

export const metadata: Metadata = { title: "Your downloads", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function DownloadsPage() {
  return (
    <Suspense fallback={<OrderStatusFallback />}>
      <OrderStatusView mode="downloads" />
    </Suspense>
  );
}
