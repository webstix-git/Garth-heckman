import type { Metadata } from "next";
import { Catalog } from "@/lib/catalog";
import { enrichPrintifyProduct, enrichPrintifyProducts } from "@/lib/enrich-printify";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { ProductView } from "@/components/ProductView";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return Catalog.all().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = Catalog.bySlug(slug);
  if (!base) return { title: "Product" };
  const p = await enrichPrintifyProduct(base);
  return { title: { absolute: p.seo.title }, description: p.seo.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = Catalog.bySlug(slug);
  const product = base ? await enrichPrintifyProduct(base) : undefined;
  const related = product ? await enrichPrintifyProducts(Catalog.related(product)) : [];

  return (
    <SiteChrome nav="store">
      <main id="main">
        <ProductView slug={slug} product={product} relatedProducts={related} />
      </main>
    </SiteChrome>
  );
}
