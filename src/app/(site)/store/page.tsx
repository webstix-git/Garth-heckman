import type { Metadata } from "next";
import { Suspense } from "react";
import StoreClient from "./StoreClient";
import { listStorefrontCategories, listStorefrontProducts } from "@/lib/catalog-public";
import { getStoreSpotlightProduct } from "@/lib/storefront-spotlights";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Books & Resources",
  description: "Books, digital downloads and branded merchandise from Garth Heckman.",
};

export default async function StorePage() {
  const [products, categories] = await Promise.all([listStorefrontProducts(), listStorefrontCategories()]);
  const spotlightProduct = await getStoreSpotlightProduct(products);

  return (
    <Suspense fallback={null}>
      <StoreClient
        initialProducts={products}
        categories={categories.map(({ name, slug, parentSlug }) => ({ name, slug, parentSlug }))}
        spotlightProduct={spotlightProduct}
      />
    </Suspense>
  );
}
