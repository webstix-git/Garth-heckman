import "server-only";

import {
  countCategoriesTrashFromDb,
  createCategoryInDb,
  deleteCategoryInDb,
  listCategoriesFromDb,
  restoreCategoryInDb,
  trashCategoryInDb,
  updateCategoryInDb,
} from "@/lib/catalog-supabase";
import { matchesSearch } from "@/services/delay";
import type { Category, CategoryInput } from "@/types";

export async function listCategories(
  search?: string,
  options?: { trash?: boolean },
): Promise<Category[]> {
  const result = await listCategoriesFromDb({ trash: options?.trash });
  const rows = result.ok ? result.categories : [];
  return rows.filter((c) => matchesSearch(`${c.name} ${c.slug} ${c.description}`, search));
}

export async function getCategory(id: string): Promise<Category | null> {
  const rows = await listCategories();
  return rows.find((c) => c.id === id) ?? null;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const result = await createCategoryInDb(input);
  if (!result.ok || !result.category) {
    throw new Error(result.error || "Failed to create category");
  }
  return result.category;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  const result = await updateCategoryInDb(id, input);
  if (!result.ok || !result.category) {
    throw new Error(result.error || "Failed to update category");
  }
  return result.category;
}

export async function trashCategory(id: string): Promise<void> {
  const result = await trashCategoryInDb(id);
  if (!result.ok) throw new Error(result.error || "Failed to move category to trash");
}

export async function restoreCategory(id: string): Promise<void> {
  const result = await restoreCategoryInDb(id);
  if (!result.ok) throw new Error(result.error || "Failed to restore category");
}

export async function permanentlyDeleteCategory(id: string): Promise<void> {
  const result = await deleteCategoryInDb(id);
  if (!result.ok) throw new Error(result.error || "Failed to delete category");
}

/** @deprecated Use trashCategory — kept as alias for move-to-trash behavior. */
export async function deleteCategory(id: string): Promise<void> {
  return trashCategory(id);
}

export async function countCategoriesTrash(): Promise<number> {
  return countCategoriesTrashFromDb();
}
