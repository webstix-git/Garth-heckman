import { redirect } from "next/navigation";

/** Product detail view removed — always open the edit screen. */
export default async function ProductDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/products/${slug}/edit`);
}
