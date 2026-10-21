"use client";

import { useState } from "react";
import { Shot } from "@/components/Shot";
import { IconArrow } from "@/components/icons";
import { formatPostDate, type PostView } from "@/lib/custom-posts";

export default function ShortsClient({ posts, categories }: { posts: PostView[]; categories: string[] }) {
  const [cur, setCur] = useState("");
  const [shown, setShown] = useState(6);
  const list = cur ? posts.filter((post) => post.category === cur) : posts;

  return (
    <section className="sec">
      <div className="wrap">
        {categories.length > 0 ? (
          <div className="row mb5" id="filters" role="group" aria-label="Filter by category">
            {[{ value: "", name: "All" }, ...categories.map((name) => ({ value: name, name }))].map((f) => (
              <button
                key={f.value || "all"}
                className="chip"
                aria-pressed={cur === f.value}
                type="button"
                onClick={() => {
                  setCur(f.value);
                  setShown(6);
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        ) : null}

        {list.length === 0 ? (
          <p className="meta meta--dim">No published Shorts yet.</p>
        ) : (
          <div className="bgrid" id="grid">
            {list.slice(0, shown).map((p) => (
              <article className="bcard" key={p.slug}>
                <div className="bcard__media">
                  <Shot variant="warm" ratio="16-9" label={false} alt={p.imageAlt} src={p.image || undefined} />
                </div>
                <div className="bcard__body">
                  <div className="bcard__top">
                    {p.category ? <span className="meta meta--gold">{p.category}</span> : <span />}
                    <span className="meta meta--dim tnum">{formatPostDate(p.date)}</span>
                  </div>
                  <h2 className="bcard__t">
                    <a href={`/shorts/${p.slug}`}>{p.title}</a>
                  </h2>
                  {p.description ? (
                    <p className="bcard__tldr">
                      <b>TL;DR</b>
                      {p.description}
                    </p>
                  ) : null}
                  <div className="bcard__foot">
                    <span className="meta meta--dim">Garth Heckman · {formatPostDate(p.date)}</span>
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
          <button className="btn btn--line btn--lg" type="button" hidden={shown >= list.length} onClick={() => setShown((n) => n + 6)}>
            Load more
          </button>
        </div>
      </div>
    </section>
  );
}
