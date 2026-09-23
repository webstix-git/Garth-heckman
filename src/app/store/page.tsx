import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/lib/catalog";
import { enrichPrintifyProducts } from "@/lib/enrich-printify";
import StoreClient from "./StoreClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Books & Resources",
  description: "WTFU, digital downloads, the free Generations Training Deck, and branded merchandise.",
};

export default async function StorePage() {
  const products = await enrichPrintifyProducts(Catalog.all());
  return (
    <Suspense fallback={null}>
      <StoreClient products={products} />
    </Suspense>
  );
}
