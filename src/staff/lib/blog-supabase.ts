import "server-only";

import {
  EVANGELISM_CONTENT,
  GENERATIONS_CONTENT,
  MARRIAGE_CONTENT,
} from "@/lib/blog-seed-content";
import { applyImageSizeStyles } from "@/lib/html-image-sizes";
import { GARTH_STORE_ID } from "@/lib/products-supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import { getRequestStoreId } from "@/lib/tenant-store";
import { applyTrashFilter, hasTrashColumn, purgeExpiredCatalogTrash } from "@/lib/catalog-trash";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { BlogPost, BlogPostInput, SeoFields } from "@/types";

export type BlogSiteTheme = "warm" | "dark" | "cool" | "light";

export type BlogSiteFields = {
  tag: string;
  tagLabel: string;
  read: string;
  v: BlogSiteTheme;
  h1: [string, string];
  lede: string;
  tldr: string;
  d: string;
  imgAlt: string;
  imgNote: string;
  badges: string[];
  quote: { text: string; cite: string };
  cta: { kicker: string; t: string; d: string; href: string; btn: string };
};

type DbBlogPost = {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  cover_media_id?: string | null;
  author: string;
  category: string;
  category_id?: string | null;
  blog_categories?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
  seo: SeoFields | Record<string, unknown> | null;
  site: BlogSiteFields | Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

const SELECT_WITH_COVER =
  "id, store_id, title, slug, excerpt, content, featured_image, cover_media_id, author, category, category_id, blog_categories(id, name, slug), tags, status, published_at, seo, site, created_at, updated_at";

const SELECT =
  "id, store_id, title, slug, excerpt, content, featured_image, author, category, category_id, blog_categories(id, name, slug), tags, status, published_at, seo, site, created_at, updated_at";

async function resolveCoverImages(rows: DbBlogPost[]): Promise<DbBlogPost[]> {
  const needed = [
    ...new Set(
      rows
        .filter((row) => row.cover_media_id)
        .map((row) => String(row.cover_media_id))
    ),
  ];
  let next = rows;
  if (needed.length) {
    const supabase = createSupabaseAdmin();
    const query = supabase
      .from("media")
      .select("id, public_url, deleted_at")
      .in("id", needed)
      .is("deleted_at", null);
    let { data, error } = await query;
    if (error?.message?.includes("media.deleted_at does not exist")) {
      const legacy = await supabase.from("media").select("id, public_url, metadata").in("id", needed);
      data = (legacy.data ?? [])
        .filter((item) => !(item.metadata && typeof item.metadata === "object" && "trashedAt" in item.metadata))
        .map((item) => ({ id: item.id, public_url: item.public_url, deleted_at: null }));
      error = legacy.error;
    }
    if (!error) {
      const byId = new Map(
        (data ?? []).map((item) => [item.id, String(item.public_url || "").trim()])
      );
      next = rows.map((row) => {
        if (!row.cover_media_id) return row;
        const url = byId.get(String(row.cover_media_id)) || "";
        return { ...row, featured_image: url };
      });
    }
  }

  return scrubDeletedMediaFeaturedUrls(next);
}

/** Drop featured_image when it still points at a trashed/removed Media file. */
async function scrubDeletedMediaFeaturedUrls(rows: DbBlogPost[]): Promise<DbBlogPost[]> {
  const urls = [
    ...new Set(
      rows
        .map((row) => String(row.featured_image || "").trim())
        .filter((url) => /^https?:\/\//i.test(url))
    ),
  ];
  if (!urls.length) return rows;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("media")
    .select("public_url, deleted_at, metadata")
    .in("public_url", urls);
  if (error || !data?.length) return rows;

  const blocked = new Set<string>();
  for (const item of data) {
    const url = String(item.public_url || "").trim();
    if (!url) continue;
    const trashed =
      Boolean(item.deleted_at) ||
      Boolean(item.metadata && typeof item.metadata === "object" && "trashedAt" in item.metadata);
    if (trashed) blocked.add(url);
  }
  if (!blocked.size) return rows;

  return rows.map((row) => {
    const url = String(row.featured_image || "").trim();
    return blocked.has(url) ? { ...row, featured_image: "" } : row;
  });
}

function resolveFeaturedImage(row: DbBlogPost): string {
  return String(row.featured_image || "").trim();
}

async function loadBlogRows(
  run: (
    select: string
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<{ rows: DbBlogPost[]; error: string | null }> {
  const primary = await run(SELECT_WITH_COVER);
  if (!primary.error) {
    const raw = primary.data;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return {
      rows: await resolveCoverImages(list as DbBlogPost[]),
      error: null,
    };
  }
  if (/cover_media_id/i.test(primary.error.message)) {
    const fallback = await run(SELECT);
    if (fallback.error) return { rows: [], error: fallback.error.message };
    const raw = fallback.data;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return { rows: list as DbBlogPost[], error: null };
  }
  return { rows: [], error: primary.error.message };
}

const CATEGORY_TO_TAG: Record<string, string> = {
  Marriage: "marriage",
  Generations: "generations",
  Evangelism: "evangelism",
  // Legacy labels from earlier drafts / seeded rows
  "Marriage & Relationships": "marriage",
  "Generational Differences": "generations",
};

const TAG_TO_CATEGORY: Record<string, string> = {
  marriage: "Marriage",
  generations: "Generations",
  evangelism: "Evangelism",
};

function normalizeCategoryName(category: string): string {
  const tag = CATEGORY_TO_TAG[category];
  if (tag) return TAG_TO_CATEGORY[tag] || category;
  return category;
}

function splitTitle(title: string): [string, string] {
  const cleaned = title.trim().replace(/\s+/g, " ");
  if (!cleaned) return ["Untitled", ""];

  // Short titles stay on one line — forced mid-string splits look broken.
  if (cleaned.length < 28 || !cleaned.includes(" ")) {
    return [cleaned, ""];
  }

  const mid = Math.floor(cleaned.length / 2);
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < cleaned.length; i += 1) {
    if (cleaned[i] !== " ") continue;
    const dist = Math.abs(i - mid);
    // Prefer a break in the middle third of the title.
    if (i < cleaned.length * 0.25 || i > cleaned.length * 0.75) continue;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  if (best === -1) {
    // Fall back to nearest space anywhere, still never mid-word.
    const before = cleaned.lastIndexOf(" ", mid);
    const after = cleaned.indexOf(" ", mid);
    best =
      before === -1
        ? after
        : after === -1
          ? before
          : mid - before <= after - mid
            ? before
            : after;
  }

  if (best <= 0) return [cleaned, ""];
  return [cleaned.slice(0, best), cleaned.slice(best + 1)];
}

function estimateRead(content: string): string {
  const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}

export function buildSiteFields(
  input: Pick<BlogPostInput, "title" | "excerpt" | "content" | "category" | "tags" | "featuredImage">,
  existing?: BlogSiteFields | null,
): BlogSiteFields {
  const category = normalizeCategoryName(
    input.category || existing?.tagLabel || "Marriage",
  );
  const tag = CATEGORY_TO_TAG[category] || existing?.tag || "marriage";
  const excerpt = input.excerpt || existing?.lede || "";
  const nextTitle = input.title || "Untitled";
  const titleChanged =
    !existing?.h1 ||
    `${existing.h1[0]} ${existing.h1[1]}`.replace(/\s+/g, " ").trim() !==
      nextTitle.trim();

  return {
    tag,
    tagLabel: category,
    read: existing?.read || estimateRead(input.content || ""),
    v: existing?.v || "warm",
    h1: titleChanged ? splitTitle(nextTitle) : existing.h1,
    lede: existing?.lede || excerpt,
    tldr: existing?.tldr || excerpt,
    d: existing?.d || excerpt,
    imgAlt: existing?.imgAlt || input.title || "Blog image",
    imgNote: existing?.imgNote || category,
    badges: input.tags?.length
      ? input.tags
      : existing?.badges?.length
        ? existing.badges
        : [category],
    quote: existing?.quote || { text: "", cite: "" },
    cta: existing?.cta || {
      kicker: "Keep going",
      t: "More from the blog",
      d: "Marriage, generations, evangelism — written the way Garth talks in the room.",
      href: "/blog",
      btn: "All posts",
    },
  };
}

function asSeo(value: DbBlogPost["seo"], title: string, excerpt: string): SeoFields {
  const seo = (value || {}) as Partial<SeoFields>;
  return {
    title: typeof seo.title === "string" && seo.title ? seo.title : title,
    description:
      typeof seo.description === "string" && seo.description ? seo.description : excerpt,
    noindex: Boolean(seo.noindex),
    nofollow: Boolean(seo.nofollow),
  };
}

function asSite(value: DbBlogPost["site"]): BlogSiteFields | null {
  if (!value || typeof value !== "object") return null;
  const site = value as Partial<BlogSiteFields>;
  if (!site.tag || !site.h1) return null;
  return site as BlogSiteFields;
}

function mapRow(row: DbBlogPost): BlogPost {
  const relatedCategory = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    featuredImage: resolveFeaturedImage(row),
    author: row.author || "Garth Heckman",
    category: normalizeCategoryName(relatedCategory?.name || row.category || "Marriage"),
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status === "published" ? "published" : "draft",
    publishedAt: row.published_at || undefined,
    seo: asSeo(row.seo, row.title, row.excerpt || ""),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function mapRowToSitePost(row: DbBlogPost) {
  const admin = mapRow(row);
  const site =
    asSite(row.site) ||
    buildSiteFields({
      title: admin.title,
      excerpt: admin.excerpt,
      content: admin.content,
      category: admin.category,
      tags: admin.tags,
      featuredImage: admin.featuredImage,
    });

  const categoryLabel = normalizeCategoryName(admin.category || site.tagLabel || "Marriage");
  const tag = (CATEGORY_TO_TAG[categoryLabel] ||
    CATEGORY_TO_TAG[site.tagLabel] ||
    site.tag ||
    (Array.isArray(row.blog_categories) ? row.blog_categories[0]?.slug : row.blog_categories?.slug) ||
    categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));

  const published = row.published_at || row.created_at;
  const date = new Date(published);
  const dateShort = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  const dateLong = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    slug: admin.slug,
    tag,
    tagLabel: categoryLabel,
    read: site.read || estimateRead(admin.content),
    date: dateShort,
    dateLong,
    v: (["warm", "dark", "cool", "light"].includes(site.v) ? site.v : "warm") as BlogSiteTheme,
    t: admin.title,
    h1: splitTitle(admin.title),
    lede: site.lede || admin.excerpt,
    tldr: site.tldr || admin.excerpt,
    d: site.d || admin.excerpt,
    img: admin.featuredImage || "",
    imgAlt: site.imgAlt || admin.title,
    imgNote: site.imgNote || admin.category,
    badges: site.badges?.length ? site.badges : admin.tags,
    quote: site.quote,
    cta: site.cta,
    content: applyImageSizeStyles(admin.content || ""),
    seo: {
      title: admin.seo.title,
      description: admin.seo.description,
      noindex: Boolean(admin.seo.noindex),
      nofollow: Boolean(admin.seo.nofollow),
    },
  };
}

function seedRows() {
  const storeId = GARTH_STORE_ID;
  return [
    {
      store_id: storeId,
      title: "Name the thing that will actually end it",
      slug: "name-the-thing-that-will-end-it",
      excerpt:
        "Date night is not a marriage plan. Find the crack, say it out loud, then rebuild what is under the floor.",
      content: MARRIAGE_CONTENT,
      featured_image: "/assets/img/room-relationship.png",
      author: "Garth Heckman",
      category: "Marriage",
      tags: ["Marriage", "Relationship Recall"],
      status: "published",
      published_at: "2026-08-18T12:00:00.000Z",
      seo: {
        title: "Name the thing that will actually end it",
        description:
          "Date night is not a marriage plan. Find the crack, say it out loud, then rebuild what is under the floor.",
      },
      site: {
        tag: "marriage",
        tagLabel: "Marriage",
        read: "7 min",
        v: "warm",
        h1: ["Name the thing", "that will actually end it"],
        lede: "Date night is not a marriage plan. Find the crack, say it out loud, then rebuild what is under the floor.",
        tldr: "Encouragement keeps a couple in the room. It is not what saves them. Name the thing that will actually end the marriage, say it out loud, and repair that. The rest is paint.",
        d: "Most marriage help is a pep talk with a worksheet. The house is still on fire. Here is what to do instead.",
        imgAlt: "Garth Heckman and his wife at the table",
        imgNote: "Marriage · at the table",
        badges: ["Marriage", "Relationship Recall"],
        quote: {
          text: "Find the cracks in the foundation, expose them, rebuild them, and give you a total recall.",
          cite: "Relationship Recall",
        },
        cta: {
          kicker: "Keep going",
          t: "Get the first Relationship Recall email",
          d: "One a week. Unsubscribe whenever.",
          href: "/relationship-recall",
          btn: "Sign up",
        },
      },
    },
    {
      store_id: storeId,
      title: "They were raised in a different room",
      slug: "they-were-raised-in-a-different-room",
      excerpt:
        "Five generations in one sanctuary is not a personality problem. It is a translation problem. Stop preaching like everybody grew up in your decade.",
      content: GENERATIONS_CONTENT,
      featured_image: "/assets/img/room-bridgeworks.png",
      author: "Garth Heckman",
      category: "Generations",
      tags: ["Generations", "Bridgeworks"],
      status: "published",
      published_at: "2026-08-11T12:00:00.000Z",
      seo: {
        title: "They were raised in a different room",
        description:
          "Five generations in one sanctuary is not a personality problem. It is a translation problem.",
      },
      site: {
        tag: "generations",
        tagLabel: "Generations",
        read: "7 min",
        v: "cool",
        h1: ["They were raised", "in a different room"],
        lede: "Five generations in one sanctuary is not a personality problem. It is a translation problem. Stop preaching like everybody grew up in your decade.",
        tldr: "Traditionalists built it. Boomers led it. Gen X is running it tired. Millennials stay if it is real. Gen Z will not come back for a brand. Preach like you know which room you are in.",
        d: "Why your staff meeting keeps turning into a culture war, and what to do before another generation walks.",
        imgAlt: "Garth Heckman with a room of church leaders around working tables",
        imgNote: "Generations · in the room",
        badges: ["Generations", "Bridgeworks"],
        quote: {
          text: "You cannot preach one sermon to five rooms and then get mad that four of them heard a slight.",
          cite: "Bridgeworks",
        },
        cta: {
          kicker: "The work",
          t: "Book a Bridgeworks discovery call",
          d: "Ask Garth to teach your business, church or church staff how to Understand, Attract, Connect and Disciple.",
          href: "/bridgeworks",
          btn: "Book the call",
        },
      },
    },
    {
      store_id: storeId,
      title: "If it sounds like a pitch, they already left",
      slug: "if-it-sounds-like-a-pitch-they-already-left",
      excerpt:
        "People have been sold all week. They did not come to church for another close. Tell the truth. Stay in the room when it gets awkward.",
      content: EVANGELISM_CONTENT,
      featured_image: "/assets/img/room-church.png",
      author: "Garth Heckman",
      category: "Evangelism",
      tags: ["Evangelism", "Simply Church"],
      status: "published",
      published_at: "2026-08-04T12:00:00.000Z",
      seo: {
        title: "If it sounds like a pitch, they already left",
        description:
          "People have been sold all week. They did not come to church for another close. Tell the truth. Stay in the room when it gets awkward.",
      },
      site: {
        tag: "evangelism",
        tagLabel: "Evangelism",
        read: "6 min",
        v: "dark",
        h1: ["If it sounds like a pitch,", "they already left"],
        lede: "People have been sold all week. They did not come to church for another close. Tell the truth. Stay in the room when it gets awkward.",
        tldr: "Evangelism that counts hands and runs a funnel is a sales meeting with a cross on the wall. What still works is a straight story, a real question, and somebody who is not in a hurry.",
        d: "Stop treating the gospel like a product launch. Tell the truth about your own life and stay after it gets quiet.",
        imgAlt: "Garth Heckman on a church stage with a pastor and an open Bible",
        imgNote: "Evangelism · Sunday",
        badges: ["Evangelism", "Simply Church"],
        quote: {
          text: "If your evangelism strategy requires a fog machine, you do not have a strategy. You have a production.",
          cite: "Make God look good",
        },
        cta: {
          kicker: "A smaller room",
          t: "Start one in your living room",
          d: "Ten people, coffee, names. Much like Acts 2, and considerably less complicated.",
          href: "/simply-church",
          btn: "Simply Church",
        },
      },
    },
  ];
}

let seedAttempted = false;

export async function ensureBlogSeeded(storeId = GARTH_STORE_ID): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  // The old editorial seed belongs solely to the original Garth store.
  // New stores start with an empty blog, never with copied content.
  if (storeId !== GARTH_STORE_ID) return { ok: true };
  if (seedAttempted) return { ok: true };
  seedAttempted = true;

  try {
    const supabase = createSupabaseAdmin();
    const { count, error } = await supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);

    if (error) {
      seedAttempted = false;
      const missing =
        /Could not find the table|schema cache|does not exist/i.test(error.message);
      return {
        ok: false,
        error: missing
          ? "blog_posts table missing — run supabase/APPLY_BLOG.sql in the Supabase SQL Editor"
          : error.message,
      };
    }
    if ((count ?? 0) > 0) return { ok: true };

    const { error: insertError } = await supabase.from("blog_posts").insert(seedRows());
    if (insertError) {
      seedAttempted = false;
      return { ok: false, error: insertError.message };
    }
    return { ok: true };
  } catch (err) {
    seedAttempted = false;
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to seed blog",
    };
  }
}

export async function listBlogPostsFromDb(options?: {
  trash?: boolean;
}): Promise<{
  ok: boolean;
  posts: BlogPost[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, posts: [], error: "Database is not configured" };
  }
  const storeId = await getCurrentAdminStoreId();
  await ensureBlogSeeded(storeId);
  try {
    if (options?.trash) {
      await purgeExpiredCatalogTrash();
    }
    const supabase = createSupabaseAdmin();
    const trash = Boolean(options?.trash);
    const trashSupported = await hasTrashColumn("blog_posts");
    if (trash && !trashSupported) {
      return { ok: true, posts: [] };
    }
    const { rows, error } = await loadBlogRows((select) => {
      let next = supabase
        .from("blog_posts")
        .select(select)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      next = applyTrashFilter(next, trash, trashSupported);
      return next;
    });

    if (error) {
      const missing =
        /Could not find the table|schema cache|does not exist/i.test(error);
      return {
        ok: false,
        posts: [],
        error: missing
          ? "blog_posts table missing — run supabase/APPLY_BLOG.sql in the Supabase SQL Editor"
          : error,
      };
    }
    return { ok: true, posts: rows.map(mapRow) };
  } catch (err) {
    return {
      ok: false,
      posts: [],
      error: err instanceof Error ? err.message : "Failed to load blog posts",
    };
  }
}

export async function listPublishedBlogPostsFromDb(): Promise<{
  ok: boolean;
  posts: ReturnType<typeof mapRowToSitePost>[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, posts: [], error: "Database is not configured" };
  }
  const storeId = await getRequestStoreId();
  await ensureBlogSeeded(storeId);
  try {
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("blog_posts");
    const { rows, error } = await loadBlogRows((select) => {
      let query = supabase
        .from("blog_posts")
        .select(select)
        .eq("store_id", storeId)
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      query = applyTrashFilter(query, false, trashSupported);
      return query;
    });

    if (error) {
      const missing =
        /Could not find the table|schema cache|does not exist/i.test(error);
      return {
        ok: false,
        posts: [],
        error: missing
          ? "blog_posts table missing — run supabase/APPLY_BLOG.sql in the Supabase SQL Editor"
          : error,
      };
    }
    return {
      ok: true,
      posts: rows.map(mapRowToSitePost),
    };
  } catch (err) {
    return {
      ok: false,
      posts: [],
      error: err instanceof Error ? err.message : "Failed to load published posts",
    };
  }
}

export async function getBlogPostByIdFromDb(
  id: string,
): Promise<{ ok: boolean; post?: BlogPost; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const { rows, error } = await loadBlogRows((select) =>
      supabase
        .from("blog_posts")
        .select(select)
        .eq("store_id", storeId)
        .eq("id", id)
        .maybeSingle()
    );

    if (error) return { ok: false, error };
    const data = rows[0];
    if (!data) return { ok: false, error: "Post not found" };
    return { ok: true, post: mapRow(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load post",
    };
  }
}

export async function getPublishedBlogPostBySlugFromDb(
  slug: string,
): Promise<{
  ok: boolean;
  post?: ReturnType<typeof mapRowToSitePost>;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  const storeId = await getRequestStoreId();
  await ensureBlogSeeded(storeId);
  try {
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("blog_posts");
    const { rows, error } = await loadBlogRows((select) => {
      let query = supabase
        .from("blog_posts")
        .select(select)
        .eq("store_id", storeId)
        .eq("slug", slug)
        .eq("status", "published");
      query = applyTrashFilter(query, false, trashSupported);
      return query.maybeSingle();
    });

    if (error) return { ok: false, error };
    const data = rows[0];
    if (!data) return { ok: false, error: "Post not found" };
    return { ok: true, post: mapRowToSitePost(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load post",
    };
  }
}

export async function countBlogPostsFromDb(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, count: 0, error: "Database is not configured" };
  }
  const storeId = await getCurrentAdminStoreId();
  await ensureBlogSeeded(storeId);
  try {
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("blog_posts");
    let query = supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);
    query = applyTrashFilter(query, false, trashSupported);
    const { count, error } = await query;

    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: count ?? 0 };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      error: err instanceof Error ? err.message : "Failed to count posts",
    };
  }
}

async function loadExistingSite(id: string, storeId: string): Promise<BlogSiteFields | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("blog_posts")
    .select("site")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();
  return asSite((data as { site?: DbBlogPost["site"] } | null)?.site ?? null);
}

export async function createBlogPostInDb(
  input: BlogPostInput,
): Promise<{ ok: boolean; post?: BlogPost; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  const storeId = await getCurrentAdminStoreId();
  await ensureBlogSeeded(storeId);
  try {
    const site = buildSiteFields(input);
    const stamp = new Date().toISOString();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        store_id: storeId,
        title: input.title.trim(),
        slug: input.slug.trim(),
        excerpt: input.excerpt || "",
        content: input.content || "",
        featured_image: input.featuredImage || "",
        author: input.author || "Store Admin",
        category: input.category ? normalizeCategoryName(input.category) : "Marriage",
        tags: input.tags || [],
        status: input.status,
        published_at:
          input.status === "published"
            ? input.publishedAt || stamp
            : input.publishedAt || null,
        seo: input.seo || {},
        site,
      })
      .select(SELECT)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message || "Failed to create post" };
    }
    return { ok: true, post: mapRow(data as DbBlogPost) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create post",
    };
  }
}

export async function updateBlogPostInDb(
  id: string,
  input: Partial<BlogPostInput>,
): Promise<{ ok: boolean; post?: BlogPost; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const existing = await getBlogPostByIdFromDb(id);
    if (!existing.ok || !existing.post) {
      return { ok: false, error: existing.error || "Post not found" };
    }

    const merged: BlogPostInput = {
      ...existing.post,
      ...input,
      seo: input.seo ? { ...existing.post.seo, ...input.seo } : existing.post.seo,
    };

    const storeId = await getCurrentAdminStoreId();
    const previousSite = await loadExistingSite(id, storeId);
    const site = buildSiteFields(merged, previousSite);
    const stamp = new Date().toISOString();

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        title: merged.title.trim(),
        slug: merged.slug.trim(),
        excerpt: merged.excerpt || "",
        content: merged.content || "",
        featured_image: merged.featuredImage || "",
        author: merged.author || "Store Admin",
        category: normalizeCategoryName(merged.category || "Marriage"),
        tags: merged.tags || [],
        status: merged.status,
        published_at:
          merged.status === "published"
            ? merged.publishedAt || existing.post.publishedAt || stamp
            : merged.publishedAt || null,
        seo: merged.seo || {},
        site,
        updated_at: stamp,
      })
      .eq("store_id", storeId)
      .eq("id", id)
      .select(SELECT)
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message || "Failed to update post" };
    }
    return { ok: true, post: mapRow(data as DbBlogPost) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update post",
    };
  }
}

export async function countBlogTrashFromDb(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const trashSupported = await hasTrashColumn("blog_posts");
  if (!trashSupported) return 0;
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);
  query = applyTrashFilter(query, true, trashSupported);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function trashBlogPostInDb(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("blog_posts");
    const now = new Date().toISOString();
    if (trashSupported) {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          deleted_at: now,
          status: "draft",
          updated_at: now,
        })
        .eq("store_id", storeId)
        .eq("id", id)
        .is("deleted_at", null);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("store_id", storeId)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to move post to trash",
    };
  }
}

export async function restoreBlogPostInDb(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("blog_posts");
    const now = new Date().toISOString();
    if (!trashSupported) {
      return { ok: false, error: "Trash is not enabled on this database yet" };
    }
    const { error } = await supabase
      .from("blog_posts")
      .update({
        deleted_at: null,
        updated_at: now,
      })
      .eq("store_id", storeId)
      .eq("id", id)
      .not("deleted_at", "is", null);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to restore post",
    };
  }
}

export async function permanentlyDeleteBlogPostInDb(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();
    const trashSupported = await hasTrashColumn("blog_posts");
    let query = supabase.from("blog_posts").delete().eq("store_id", storeId).eq("id", id);
    if (trashSupported) {
      query = query.not("deleted_at", "is", null);
    }
    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete post",
    };
  }
}

export async function deleteBlogPostInDb(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  return trashBlogPostInDb(id);
}

export async function renameBlogCategoryInDb(from: string, to: string) {
  if (!from || from === to || !isSupabaseConfigured()) return;
  const storeId = await getCurrentAdminStoreId();
  const supabase = createSupabaseAdmin();
  await supabase
    .from("blog_posts")
    .update({ category: to })
    .eq("store_id", storeId)
    .eq("category", from);
}

export async function reassignBlogCategoryInDb(from: string, to: string) {
  return renameBlogCategoryInDb(from, to);
}
