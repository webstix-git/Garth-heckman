"use client";

import { useParams } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { listCategories } from "@/services/categories";
import { getProduct } from "@/services/products";

export default function EditProductPage() {
  const params = useParams<{ slug: string }>();
  const product = useAsyncData(() => getProduct(params.slug), params.slug);
  const categories = useAsyncData(() => listCategories());

  if (product.loading || categories.loading) return <LoadingState />;
  if (!product.data) {
    return <ErrorState title="Product not found" onRetry={() => void product.reload()} />;
  }
  if (!categories.data) {
    return <ErrorState onRetry={() => void categories.reload()} />;
  }

  return <ProductForm product={product.data} categories={categories.data} />;
}
