"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { ImageUploader } from "@/components/shared/image-uploader";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/format";
import { createCategory, updateCategory } from "@/services/categories";
import type { Category, CategoryInput } from "@/types";

const fieldClass = "admin-field-input h-10";
const textareaClass = "admin-field-input min-h-48 resize-y";

const empty = (): CategoryInput => ({
  name: "",
  slug: "",
  image: "",
  imageMediaId: "",
  description: "",
  active: true,
});

function toInput(category: Category): CategoryInput {
  const { id: _id, productCount: _count, createdAt: _created, ...rest } = category;
  void _id;
  void _count;
  void _created;
  return {
    ...rest,
    imageMediaId: category.imageMediaId || "",
  };
}

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryInput>(category ? toInput(category) : empty());
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(category);

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setBusy(true);
    try {
      if (category) {
        await updateCategory(category.id, form);
        toast.success("Category updated");
      } else {
        await createCategory({ ...form, slug: form.slug || slugify(form.name) });
        toast.success("Category created");
      }
      router.push("/admin/categories");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void save();
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <PageHeader
        title={isEdit ? "Edit category" : "Add category"}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/categories")}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !form.name.trim()}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {isEdit ? "Save changes" : "Save"}
            </Button>
          </>
        }
      />

      <div className="product-editor-grid grid items-start gap-5 lg:gap-6">
        <div className="product-editor-column space-y-5">
          <SectionCard title="Category" className="admin-surface-card">
            <div className="grid gap-4">
              <FormField label="Name" htmlFor="cat-name" required>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                      slug: isEdit ? current.slug : slugify(e.target.value),
                    }))
                  }
                  placeholder="Books"
                  className={fieldClass}
                />
              </FormField>

              <FormField label="Slug" htmlFor="cat-slug">
                <Input
                  id="cat-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, slug: slugify(e.target.value) }))
                  }
                  placeholder="books"
                  className={`${fieldClass} font-mono text-sm`}
                />
              </FormField>

              <FormField label="Description" htmlFor="cat-desc">
                <Textarea
                  id="cat-desc"
                  className={textareaClass}
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, description: e.target.value }))
                  }
                  placeholder="Shown on category pages in your storefront."
                />
              </FormField>
            </div>
          </SectionCard>
        </div>

        <div className="product-editor-column">
          <SectionCard title="Organization" className="admin-surface-card">
            <div className="grid gap-4">
              <div className="admin-inset-panel flex items-center justify-between px-3 py-3">
                <span className="text-sm font-medium">Active</span>
                <Switch
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, active: checked }))
                  }
                  aria-label="Active on storefront"
                />
              </div>

              <FormField label="Category image">
                <ImageUploader
                  value={form.image ? [form.image] : []}
                  max={1}
                  className="admin-category-image-upload"
                  uploadContext={{
                    module: "category",
                    area: "image",
                    entityId: category?.id,
                    entityTitle: form.name || category?.name,
                  }}
                  onChange={(urls, assets) =>
                    setForm((current) => ({
                      ...current,
                      image: urls[0] ?? "",
                      imageMediaId: assets?.[0]?.id ?? (urls[0] ? current.imageMediaId : ""),
                    }))
                  }
                />
              </FormField>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}
