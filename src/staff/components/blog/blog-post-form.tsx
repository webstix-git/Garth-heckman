"use client";

import {
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { ImageUploader } from "@/components/shared/image-uploader";
import { PageHeader } from "@/components/shared/page-header";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { SeoGooglePreview } from "@/components/shared/seo-google-preview";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAsyncData } from "@/hooks/use-async-data";
import { BLOG_AUTHORS } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { buildPostSeo } from "@/lib/post-seo";
import { SEO_DESC_MAX, SEO_TITLE_MAX } from "@/lib/product-seo";
import { createPost, updatePost } from "@/services/blog";
import { listBlogCategories } from "@/services/blog-categories";
import type { BlogPost, BlogPostInput, BlogPostStatus } from "@/types";

const empty = (): BlogPostInput => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  author: BLOG_AUTHORS[0],
  category: "",
  tags: [],
  status: "draft",
  seo: { title: "", description: "" },
});

function toInput(post: BlogPost): BlogPostInput {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = post;
  void _id;
  void _c;
  void _u;
  return rest;
}

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const categories = useAsyncData(() => listBlogCategories());
  const [form, setForm] = useState<BlogPostInput>(post ? toInput(post) : empty());
  const [tagsText, setTagsText] = useState(() => (post?.tags ?? []).join(", "));
  const [savingAs, setSavingAs] = useState<BlogPostStatus | null>(null);
  const seoTouched = useRef({
    title: false,
    description: false,
  });

  const saving = savingAs !== null;
  const categoryOptions = categories.data ?? [];
  const selectedCategory = form.category || categoryOptions[0]?.name || "";
  const savedStatus = post?.status ?? form.status;

  function parseTags(value: string): string[] {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function generatedSeo(source: BlogPostInput) {
    return buildPostSeo({
      title: source.title,
      excerpt: source.excerpt,
      content: source.content,
      category: source.category || selectedCategory,
      author: source.author,
    });
  }

  function withAutoSeo(next: BlogPostInput, fromSeoField?: boolean): BlogPostInput {
    if (fromSeoField) return next;
    const generated = generatedSeo(next);
    return {
      ...next,
      seo: {
        title: seoTouched.current.title ? next.seo.title : generated.title || next.seo.title,
        description: seoTouched.current.description
          ? next.seo.description
          : generated.description || next.seo.description,
        noindex: next.seo.noindex,
        nofollow: next.seo.nofollow,
      },
    };
  }

  function patch(partial: Partial<BlogPostInput>, fromSeoField = false) {
    setForm((current) => withAutoSeo({ ...current, ...partial }, fromSeoField));
  }

  const seoPreview = useMemo(() => {
    const generated = generatedSeo(form);
    return {
      title: form.seo.title.trim() || generated.title || form.title,
      description: form.seo.description.trim() || generated.description || form.excerpt,
      path: `/blog/${form.slug || slugify(form.title) || "post"}`,
    };
  }, [
    form.title,
    form.slug,
    form.excerpt,
    form.content,
    form.category,
    form.author,
    form.seo.title,
    form.seo.description,
    selectedCategory,
  ]);

  function commitTags(value = tagsText) {
    const tags = parseTags(value);
    setTagsText(tags.join(", "));
    patch({ tags });
    return tags;
  }

  function fillSeoFromPost() {
    const generated = generatedSeo(form);
    if (!generated.title && !generated.description) {
      toast.error("Add a title or excerpt first.");
      return;
    }
    seoTouched.current = {
      title: Boolean(post),
      description: Boolean(post),
    };
    setForm((current) => ({
      ...current,
      seo: {
        ...generated,
        noindex: current.seo.noindex,
        nofollow: current.seo.nofollow,
      },
    }));
    toast.success("SEO filled from post details");
  }

  async function save(nextStatus: BlogPostStatus) {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSavingAs(nextStatus);
    try {
      const tags = commitTags();
      const generated = generatedSeo(form);
      const payload: BlogPostInput = {
        ...form,
        tags,
        category: selectedCategory,
        slug: form.slug || slugify(form.title),
        status: nextStatus,
        publishedAt:
          nextStatus === "published" ? (form.publishedAt ?? new Date().toISOString()) : form.publishedAt,
        seo: {
          title: form.seo.title.trim() || generated.title,
          description: form.seo.description.trim() || generated.description,
          noindex: Boolean(form.seo.noindex),
          nofollow: Boolean(form.seo.nofollow),
        },
      };
      if (post) {
        await updatePost(post.id, payload);
        toast.success(
          nextStatus === "published"
            ? post.status === "published"
              ? "Post updated"
              : "Post published"
            : "Saved as draft",
        );
      } else {
        await createPost(payload);
        toast.success(nextStatus === "published" ? "Post published" : "Saved as draft");
      }
      router.push("/admin/blog");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSavingAs(null);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void save(savedStatus === "published" ? "published" : "draft");
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <PageHeader
        title={post ? "Edit post" : "New post"}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void save("draft")}
            >
              {savingAs === "draft" ? <Loader2 className="size-4 animate-spin" /> : null}
              Save as draft
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save("published")}>
              {savingAs === "published" ? <Loader2 className="size-4 animate-spin" /> : null}
              {post?.status === "published" ? "Update" : "Publish"}
            </Button>
          </>
        }
      />
      <div className="product-editor-grid grid items-start gap-5 lg:gap-6">
        <div className="product-editor-column space-y-5">
          <SectionCard title="Content">
            <div className="grid gap-4">
              <FormField label="Title" htmlFor="title" required>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    patch({
                      title: e.target.value,
                      slug: post ? form.slug : slugify(e.target.value),
                    })
                  }
                />
              </FormField>
              <FormField label="Slug" htmlFor="slug">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => patch({ slug: slugify(e.target.value) })}
                />
              </FormField>
              <FormField label="Excerpt" htmlFor="excerpt">
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => patch({ excerpt: e.target.value })}
                />
              </FormField>
              <FormField
                label="Body"
                hint="Preview first, then Write to edit. HTML tab for source. Select text before headings/lists."
              >
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => patch({ content })}
                  placeholder="Write the post body…"
                  uploadContext={{
                    module: "blog",
                    area: "body",
                    entityId: post?.id,
                    entityTitle: form.title || post?.title || "New post",
                  }}
                />
              </FormField>
            </div>
          </SectionCard>
          <SectionCard title="Featured image">
            <ImageUploader
              value={form.featuredImage ? [form.featuredImage] : []}
              max={1}
              onChange={(urls) => patch({ featuredImage: urls[0] ?? "" })}
              uploadContext={{
                module: "blog",
                area: "featured",
                entityId: post?.id,
                entityTitle: form.title || post?.title || "New post",
              }}
            />
          </SectionCard>
          <SectionCard
            title="SEO"
            action={
              <Button type="button" size="sm" variant="outline" onClick={fillSeoFromPost}>
                <Sparkles /> Fill from post
              </Button>
            }
          >
            <div className="grid gap-4">
              {!post ? (
                <p className="text-xs text-muted-foreground">
                  Filled automatically from the title, excerpt, and body. Edit anytime, or use Fill
                  from post to refresh it.
                </p>
              ) : null}
              <SeoGooglePreview
                title={seoPreview.title}
                description={seoPreview.description}
                path={seoPreview.path}
              />
              <FormField
                label="SEO title"
                htmlFor="seo-title"
                hint={`${form.seo.title.length}/${SEO_TITLE_MAX} recommended`}
              >
                <Input
                  id="seo-title"
                  placeholder="Generated from the post title"
                  value={form.seo.title}
                  onChange={(e) => {
                    seoTouched.current.title = true;
                    patch({ seo: { ...form.seo, title: e.target.value } }, true);
                  }}
                />
              </FormField>
              <FormField
                label="SEO description"
                htmlFor="seo-desc"
                hint={`${form.seo.description.length}/${SEO_DESC_MAX} recommended`}
              >
                <Textarea
                  id="seo-desc"
                  rows={3}
                  placeholder="Generated from the post details"
                  value={form.seo.description}
                  onChange={(e) => {
                    seoTouched.current.description = true;
                    patch({ seo: { ...form.seo, description: e.target.value } }, true);
                  }}
                />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Noindex" hint="Ask search engines not to index this post">
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={Boolean(form.seo.noindex)}
                      onCheckedChange={(checked) =>
                        patch({ seo: { ...form.seo, noindex: checked } }, true)
                      }
                    />
                  </div>
                </FormField>
                <FormField label="Nofollow" hint="Ask search engines not to follow links here">
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={Boolean(form.seo.nofollow)}
                      onCheckedChange={(checked) =>
                        patch({ seo: { ...form.seo, nofollow: checked } }, true)
                      }
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="product-editor-column">
          <SectionCard title="Publish">
            <div className="grid gap-4">
              <FormField label="Status">
                <div className="rounded-lg border bg-muted/30 px-3 py-3">
                  <StatusBadge status={savedStatus} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {savedStatus === "published" ? "Live on the blog" : "Not visible on the blog"}
                  </p>
                </div>
              </FormField>
              <FormField label="Publish date">
                <Input
                  type="datetime-local"
                  value={form.publishedAt ? form.publishedAt.slice(0, 16) : ""}
                  onChange={(e) =>
                    patch({
                      publishedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </FormField>
              <FormField label="Author">
                <Select
                  value={form.author}
                  onValueChange={(value) => {
                    if (value) patch({ author: String(value) });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {BLOG_AUTHORS.map((author) => (
                      <SelectItem key={author} value={author}>
                        {author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Category">
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    if (value) patch({ category: String(value) });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {categoryOptions.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Tags" hint="Comma separated">
                <Input
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  onBlur={() => commitTags()}
                  placeholder="Marriage, Relationship Recall"
                />
              </FormField>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}
