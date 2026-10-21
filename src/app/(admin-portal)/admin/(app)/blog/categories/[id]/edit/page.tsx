"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAsyncData } from "@/hooks/use-async-data";
import { slugify } from "@/lib/format";
import { getBlogCategory, updateBlogCategory } from "@/services/blog-categories";

export default function EditBlogCategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const category = useAsyncData(() => getBlogCategory(params.id), params.id);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!category.data || initialized) return;
    // The editor receives its values from an async resource after the initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(category.data.name);
    setSlug(category.data.slug);
    setDescription(category.data.description);
    setInitialized(true);
  }, [category.data, initialized]);

  if (category.loading) return <div className="admin-page-shell"><LoadingState /></div>;
  if (category.error) return <div className="admin-page-shell"><ErrorState title="Could not load blog category" description={category.error} onRetry={() => void category.reload()} /></div>;
  if (!category.data) return <div className="admin-page-shell"><ErrorState title="Blog category not found" /></div>;

  async function save() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setBusy(true);
    try {
      await updateBlogCategory(category.data!.id, {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
      });
      toast.success("Blog category updated");
      router.push("/admin/blog/categories");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page-shell space-y-6">
      <PageHeader
        title="Edit blog category"
        actions={<Button variant="outline" render={<Link href="/admin/blog/categories" />}><ArrowLeft /> Back to categories</Button>}
      />
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader><CardTitle>Category details</CardTitle></CardHeader>
          <CardContent className="grid gap-5">
            <FormField label="Name" htmlFor="blog-category-name" hint="The name shown on your blog and category filters.">
              <Input id="blog-category-name" value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} />
            </FormField>
            <FormField label="URL slug" htmlFor="blog-category-slug" hint="Use lowercase letters, numbers, and hyphens.">
              <Input id="blog-category-slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} />
            </FormField>
            <FormField label="Description" htmlFor="blog-category-description" hint="Optional context for editors and visitors.">
              <Textarea id="blog-category-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 resize-y" />
            </FormField>
            <div className="flex justify-end gap-2 border-t pt-5">
              <Button variant="outline" render={<Link href="/admin/blog/categories" />}>Cancel</Button>
              <Button onClick={() => void save()} disabled={busy}><Save /> {busy ? "Saving…" : "Save changes"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
