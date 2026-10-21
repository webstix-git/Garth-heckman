"use client";

import { useParams } from "next/navigation";

import { BlogPostForm } from "@/components/blog/blog-post-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { getPost } from "@/services/blog";

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const post = useAsyncData(() => getPost(params.id), params.id);
  if (post.loading) return <LoadingState />;
  if (!post.data) return <ErrorState title="Post not found" />;
  return <BlogPostForm post={post.data} />;
}
