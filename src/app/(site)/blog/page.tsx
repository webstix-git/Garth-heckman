"use client";

import { useEffect, useState } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import type { BlogPost } from "@/lib/blog";
import { IconArrow } from "@/components/icons";

export default function BlogPage() {
  const [cur, setCur] = useState("all");
  const [shown, setShown] = useState(6);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/blog", { cache: "no-store" });
        const json = (await res.json()) as {
          data?: BlogPost[];
          categories?: Array<{ slug: string; name: string }>;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Failed to load posts");
        if (!cancelled) {
          setPosts(json.data || []);
          setCategories(json.categories || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = posts.filter((post) => cur === "all" || post.tag === cur);

  return (
    <SiteChrome nav="blog">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Blog</span>
            </nav>
            <h1 className="d1">Blog</h1>
            <div className="between mt5" style={{ alignItems: "flex-end" }}>
              <p className="lede mw dim">
                Marriage and relationships, generational differences, evangelism. Written the way Garth talks in the room, not the way a content
                calendar talks. Looking for episodes instead?{" "}
                <a href="/podcast" style={{ color: "var(--acc)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  The podcast is here.
                </a>
              </p>
              <a className="btn btn--line" href="/podcast">
                The podcast
              </a>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="row mb5" id="filters" data-rv="">
              {[{ slug: "all", name: "All" }, ...categories].map((f) => (
                <button
                  key={f.slug}
                  className={`chip${cur === f.slug ? " on" : ""}`}
                  data-f={f.slug}
                  type="button"
                  onClick={() => {
                    setCur(f.slug);
                    setShown(6);
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="meta meta--dim">Loading posts…</p>
            ) : error ? (
              <p className="meta meta--dim">{error}</p>
            ) : list.length === 0 ? (
              <p className="meta meta--dim">No published posts yet.</p>
            ) : (
              <div className="bgrid" id="grid" data-stagger="">
                {list.slice(0, shown).map((p) => (
                  <article className="bcard" key={p.slug}>
                    <div className="bcard__media">
                      <Shot variant={p.v} ratio="16-9" label={false} alt={p.imgAlt} src={p.img || undefined} />
                    </div>
                    <div className="bcard__body">
                      <div className="bcard__top">
                        <span className="meta meta--gold">{p.tagLabel}</span>
                        <span className="meta meta--dim tnum">{p.read} read</span>
                      </div>
                      <h2 className="bcard__t">
                        <a href={`/blog/${p.slug}`}>{p.t}</a>
                      </h2>
                      <p className="bcard__tldr">
                        <b>TL;DR</b>
                        {p.tldr}
                      </p>
                      <div className="bcard__foot">
                        <span className="meta meta--dim">Garth Heckman · {p.date}</span>
                        <span className="bcard__go">
                          <IconArrow />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="row mt5" style={{ justifyContent: "center" }}>
              <button
                className="btn btn--line btn--lg"
                id="more"
                type="button"
                hidden={shown >= list.length}
                onClick={() => setShown((n) => n + 6)}
              >
                Load more
              </button>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
