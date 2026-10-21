"use client";

import { useParams } from "next/navigation";

import { CategoryForm } from "@/components/categories/category-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { getCategory } from "@/services/categories";

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const category = useAsyncData(() => getCategory(params.id), params.id);

  if (category.loading) {
    return (
      <div className="admin-page-shell">
        <LoadingState />
      </div>
    );
  }

  if (category.error) {
    return (
      <div className="admin-page-shell">
        <ErrorState
          title="Could not load category"
          description={category.error}
          onRetry={() => void category.reload()}
        />
      </div>
    );
  }

  if (!category.data) {
    return (
      <div className="admin-page-shell">
        <ErrorState title="Category not found" />
      </div>
    );
  }

  return (
    <div className="admin-page-shell">
      <CategoryForm category={category.data} />
    </div>
  );
}
