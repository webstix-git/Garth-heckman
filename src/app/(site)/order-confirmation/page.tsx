import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { OrderStatusView } from "@/components/OrderStatusView";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function OrderConfirmationPage() {
  return (
    <SiteChrome nav="store">
      <Suspense fallback={null}>
        <OrderStatusView mode="confirmation" />
      </Suspense>
    </SiteChrome>
  );
}
