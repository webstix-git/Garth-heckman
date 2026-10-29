import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { listCustomPosts } from "@/lib/custom-posts-server";
import { SHORTS_POST_TYPE, postView, usedCategories } from "@/lib/custom-posts";
import { pageSeo } from "@/lib/seo";
import ShortsClient from "./ShortsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const list = await listCustomPosts(SHORTS_POST_TYPE, { limit: 1 });
  if (!list?.type) return pageSeo("/shorts");
  return pageSeo("/shorts", {
    ...(list.type.name ? { title: list.type.name } : {}),
    ...(list.type.description ? { description: list.type.description } : {}),
  });
}

export default async function ShortsPage() {
  const list = await listCustomPosts(SHORTS_POST_TYPE);
  const posts = (list?.posts ?? []).map(postView);
  const name = list?.type.name || "YouTube Shorts";

  return (
    <SiteChrome nav="blog">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>{name}</span>
            </nav>
            <h1 className="d1">{name}</h1>
            <div className="between mt5" style={{ alignItems: "flex-end" }}>
              <p className="lede mw dim">
                {list?.type.description || "Short clips with the same straight talk as the blog."}
              </p>
              <a className="btn btn--line" href="/blog">
                Read the blog
              </a>
            </div>
          </div>
        </section>
        <ShortsClient posts={posts} categories={list ? usedCategories(list.type, posts) : []} />
      </main>
    </SiteChrome>
  );
}
