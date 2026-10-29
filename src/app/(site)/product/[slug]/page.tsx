import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/catalog-public";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { dynamicPageSeo } from "@/lib/seo";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductView } from "@/components/ProductView";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";

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
  const image = p.media.find((m) => m.src)?.src || null;
  return dynamicPageSeo({
    path: `/product/${p.slug}`,
    title: p.seo.title || p.title,
    absoluteTitle: true,
    description: p.seo.description || p.descriptionShort || p.subtitle,
    image,
    noindex: p.seo.noindex,
    nofollow: p.seo.nofollow,
    globalNoindex: settings.seo?.noindex,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    getStorefrontProduct(slug),
    listStorefrontProducts(),
  ]);
  if (!product) notFound();
  const image = product.media.find((m) => m.src)?.src || null;

  return (
    <SiteChrome nav="store">
      <JsonLd
        id="ld-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Store", path: "/store" },
          { name: product.title, path: `/product/${product.slug}` },
        ])}
      />
      <JsonLd
        id="ld-product"
        data={productSchema({
          name: product.title,
          description: product.seo.description || product.descriptionShort || product.subtitle,
          slug: product.slug,
          image,
          priceCents: product.price.amount,
          currency: product.price.currency,
          availability:
            product.inventory.tracked && product.inventory.quantity === 0 && !product.inventory.allowBackorder
              ? "OutOfStock"
              : "InStock",
        })}
      />
      <main id="main">
        <ProductView slug={slug} product={product} relatedProducts={allProducts} />
      </main>
    </SiteChrome>
  );
}
