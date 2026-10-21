/** Custom post types managed in the store backend (Admin → Custom Posts). */

/** The post type shown on /shorts. */
export const SHORTS_POST_TYPE = "youtube-shorts";

export type VideoValue = {
  url: string;
  provider: "youtube" | "vimeo" | "other";
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  vertical: boolean;
};

export type CustomPostField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  choices?: string[];
  value?: unknown;
};

export type CustomPostType = {
  slug: string;
  name: string;
  singularName: string;
  description: string;
  fields: CustomPostField[];
};

export type CustomPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  publishedAt: string | null;
  fields: CustomPostField[];
};

export type CustomPostList = { type: CustomPostType; total: number; posts: CustomPost[] };

/** What a card or detail page needs, read from field types rather than field names. */
export type PostView = {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  category: string;
  video: VideoValue | null;
  date: string | null;
  html: string;
  extras: Array<{ key: string; label: string; type: string; value: unknown }>;
};

const SHOWN_ELSEWHERE = new Set(["title", "textarea", "rich_text", "image", "category", "video_url", "date"]);

function first(post: CustomPost, type: string) {
  return post.fields.find((field) => field.type === type && field.value != null && field.value !== "");
}

function isVideo(value: unknown): value is VideoValue {
  return Boolean(value && typeof value === "object" && "url" in value && "provider" in value);
}

export function postView(post: CustomPost): PostView {
  const imageField = first(post, "image")?.value as { url?: string; alt?: string } | undefined;
  const video = first(post, "video_url")?.value;
  const date = first(post, "date")?.value ?? first(post, "datetime")?.value ?? post.publishedAt;
  const description = first(post, "textarea")?.value;
  const firstBy = new Map<string, string>();
  for (const field of post.fields) if (!firstBy.has(field.type)) firstBy.set(field.type, field.key);
  return {
    slug: post.slug,
    title: post.title,
    description: typeof description === "string" ? description : post.excerpt,
    image: post.image,
    imageAlt: imageField?.alt || post.title,
    category: String(first(post, "category")?.value ?? ""),
    video: isVideo(video) ? video : null,
    date: date ? String(date) : null,
    html: post.fields
      .filter((field) => field.type === "rich_text" && typeof field.value === "string")
      .map((field) => field.value as string)
      .join(""),
    extras: post.fields
      .filter((field) => field.value != null && field.value !== "" && !(SHOWN_ELSEWHERE.has(field.type) && firstBy.get(field.type) === field.key))
      .filter((field) => field.type !== "rich_text" && field.type !== "title")
      .map(({ key, label, type, value }) => ({ key, label, type, value })),
  };
}

/** Category choices on the type that have at least one post. */
export function usedCategories(type: CustomPostType, posts: PostView[]) {
  const choices = type.fields.find((field) => field.type === "category")?.choices ?? [];
  return choices.filter((choice) => posts.some((post) => post.category === choice));
}

export function formatPostDate(value: string | null, style: "short" | "long" = "short") {
  if (!value) return "";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", style === "long" ? { month: "long", day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}
