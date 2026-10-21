"use client";

import { useEffect, useMemo, useState } from "react";
import { Shot } from "@/components/Shot";
import { YOUTUBE_CHANNEL } from "@/lib/content";
import { SHORTS_POST_TYPE, postView, usedCategories, type CustomPostList, type PostView } from "@/lib/custom-posts";

const VARIANTS = ["warm", "dark", "cool", "light"] as const;

/** Latest Shorts from the store backend (Custom Posts). Hidden until there is something to show. */
export function YoutubeShortsClipsSection() {
  const [posts, setPosts] = useState<PostView[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [cur, setCur] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/custom-posts/${SHORTS_POST_TYPE}?limit=24`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<CustomPostList>) : null))
      .then((list) => {
        if (cancelled || !list) return;
        const views = list.posts.map(postView);
        setPosts(views);
        setCategories(usedCategories(list.type, views));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const all = posts ?? [];
    return (cur ? all.filter((post) => post.category === cur) : all).slice(0, 6);
  }, [posts, cur]);

  if (!posts?.length) return null;

  return (
    <section className="sec tint">
      <div className="wrap">
        <div className="between mb5" data-rv="">
          <div>
            <p className="meta meta--gold">Clips</p>
            <h2 className="d2 mt2">
              Short version,
              <br />
              on YouTube.
            </h2>
          </div>
          <p className="body sm" style={{ maxWidth: "34ch" }}>
            Clips post weekly. They open on YouTube rather than playing here. Garth wanted the channel to get the
            traffic.
          </p>
        </div>

        {categories.length > 1 ? (
          <div className="row mb5" role="group" aria-label="Filter clips by category">
            {[{ value: "", name: "All" }, ...categories.map((name) => ({ value: name, name }))].map((f) => (
              <button key={f.value || "all"} className="chip" aria-pressed={cur === f.value} type="button" onClick={() => setCur(f.value)}>
                {f.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid g3">
          {visible.map((clip, index) => (
            <a
              className="card card--link"
              href={clip.video?.url || `/shorts/${clip.slug}`}
              target={clip.video?.url ? "_blank" : undefined}
              rel={clip.video?.url ? "noopener noreferrer" : undefined}
              key={clip.slug}
            >
              <div style={{ margin: "calc(-1 * clamp(20px,2.4vw,32px)) calc(-1 * clamp(20px,2.4vw,32px)) 0" }}>
                <Shot
                  variant={VARIANTS[index % VARIANTS.length]}
                  ratio="16-9"
                  label="YouTube"
                  note="Opens on YouTube"
                  alt={clip.imageAlt}
                  src={clip.image || undefined}
                />
              </div>
              <p className="card__n mt5">{clip.category || "Short"}</p>
              <h3 className="card__t">{clip.title}</h3>
            </a>
          ))}
        </div>
        <p className="row mt5" style={{ justifyContent: "center", gap: 24 }}>
          <a className="tlink" href="/shorts">
            All shorts
          </a>
          <a className="tlink" href={`${YOUTUBE_CHANNEL}/shorts`} target="_blank" rel="noopener noreferrer">
            On YouTube
          </a>
        </p>
      </div>
    </section>
  );
}
