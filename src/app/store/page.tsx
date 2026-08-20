import type { Metadata } from "next";
import { Suspense } from "react";
import StoreClient from "./StoreClient";

export const metadata: Metadata = {
  title: "Books & Resources",
  description: "WTFU, digital downloads, the free Generations Training Deck, and branded merchandise.",
};

export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StoreClient />
    </Suspense>
  );
}
