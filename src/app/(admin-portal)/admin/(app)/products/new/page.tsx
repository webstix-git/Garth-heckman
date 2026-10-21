"use client";

import { ProductForm } from "@/components/products/product-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { listCategories } from "@/services/categories";

export default function NewProductPage() {
  const categories = useAsyncData(() => listCategories());
  if (categories.loading) return <LoadingState />;
  if (categories.error || !categories.data) {
    return <ErrorState description={categories.error ?? undefined} onRetry={() => void categories.reload()} />;
  }
  return <ProductForm categories={categories.data} />;
}
