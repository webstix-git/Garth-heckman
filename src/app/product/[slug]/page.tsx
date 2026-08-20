import type { Metadata } from "next";
import { Catalog } from "@/lib/catalog";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { ProductView } from "@/components/ProductView";

export function generateStaticParams() {
  return Catalog.all().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = Catalog.bySlug(slug);
  if (!p) return { title: "Product" };
  return { title: { absolute: p.seo.title }, description: p.seo.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <SiteChrome nav="store">
      <main id="main">
        <ProductView slug={slug} />
      </main>
    </SiteChrome>
  );
}
