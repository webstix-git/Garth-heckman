import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/catalog-public";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { robotsMetadata } from "@/lib/seo-robots";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { ProductView } from "@/components/ProductView";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await listStorefrontProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [p, { settings }] = await Promise.all([
    getStorefrontProduct(slug),
    fetchStoreSettings(),
  ]);
  if (!p) return { title: "Product" };
  return {
    title: { absolute: p.seo.title },
    description: p.seo.description,
    robots: robotsMetadata({
      globalNoindex: settings.seo?.noindex,
      noindex: p.seo.noindex,
      nofollow: p.seo.nofollow,
    }),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    getStorefrontProduct(slug),
    listStorefrontProducts(),
  ]);
  if (!product) notFound();

  return (
    <SiteChrome nav="store">
      <main id="main">
        <ProductView slug={slug} product={product} relatedProducts={allProducts} />
      </main>
    </SiteChrome>
  );
}
