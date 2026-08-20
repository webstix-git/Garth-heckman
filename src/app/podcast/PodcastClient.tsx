"use client";

import { useState } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { NowPlaying } from "@/components/NowPlaying";
import { Shot } from "@/components/Shot";
import { YOUTUBE_CHANNEL, YOUTUBE_SHORTS } from "@/lib/content";

const ART = ["warm", "dark", "cool", "light"];
const PODBEAN = "https://tda.podbean.com/";

export function PodcastClient({
  episodes,
}: {
  episodes: {
    id: string;
    title: string;
    episodeNo: string;
    durationSeconds: number;
    durationLabel: string;
    audioUrl: string;
    pageUrl: string;
    dateLabel: string;
    summary: string;
    imageUrl: string;
  }[];
}) {
  const [activeId, setActiveId] = useState(episodes[0]?.id ?? "");
  const [autoPlay, setAutoPlay] = useState(false);
  const active = episodes.find((ep) => ep.id === activeId) ?? episodes[0];

  return (
    <SiteChrome nav="">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap np-reserve">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Podcast</span>
            </nav>
            <p className="meta meta--gold">The podcast</p>
            <h1 className="d1 mt3">
              The David
              <br />
              Alliance
            </h1>
            <div className="between mt5" style={{ alignItems: "flex-end" }}>
              <p className="lede mw dim">
                Short, unsentimental episodes on faith, leadership and getting back up. Forty-two years of material and
                no interest in filling time.
              </p>
              <div className="subs meta">
                <a href={PODBEAN} target="_blank" rel="noopener">
                  Podbean
                </a>
                <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener">
                  YouTube
                </a>
                <a href="https://feed.podbean.com/tda/feed.xml" target="_blank" rel="noopener">
                  RSS
                </a>
              </div>
            </div>
          </div>

          <div className="wrap" style={{ position: "relative", zIndex: 6 }}>
            {active ? (
              <NowPlaying
                title={active.title}
                kicker={
                  active.episodeNo ? `Now playing · Ep. ${active.episodeNo}` : "Now playing · The David Alliance"
                }
                durationSeconds={active.durationSeconds}
                audioUrl={active.audioUrl}
                autoPlay={autoPlay}
                showAll={false}
              />
            ) : null}
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <div className="between mb5" data-rv="">
              <p className="meta meta--gold">Latest episodes</p>
              <p className="meta meta--dim" id="count">
                {episodes.length} on this page
              </p>
            </div>
            <div className="plist" id="list">
              {episodes.map((p, i) => {
                const current = p.id === active?.id;
                return (
                  <article className={`prow${current ? " playing" : ""}`} key={p.id}>
                    <button
                      className="prow__play"
                      type="button"
                      aria-label={current && autoPlay ? `Pause episode ${p.episodeNo || p.title}` : `Play episode ${p.episodeNo || p.title}`}
                      onClick={() => {
                        setActiveId(p.id);
                        setAutoPlay(true);
                      }}
                    >
                      <svg className="ic-play" width="14" height="14" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
                        <path d="M4 2.4v8.2l7-4.1z" />
                      </svg>
                      <svg className="ic-pause" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                        <rect x="2" y="1.5" width="3" height="9" />
                        <rect x="7" y="1.5" width="3" height="9" />
                      </svg>
                    </button>
                    <div className="prow__art">
                      <Shot variant={ART[i % 4]} ratio="1-1" label={false} src={p.imageUrl || undefined} />
                    </div>
                    <div className="prow__body">
                      <p className="prow__ep">
                        {p.episodeNo ? `Ep. ${p.episodeNo}` : "Episode"}
                        {i === 0 ? " · Latest" : ""}
                      </p>
                      <h2 className="prow__t">{p.title}</h2>
                      {p.summary ? <p className="prow__d">{p.summary}</p> : null}
                    </div>
                    <div className="prow__meta">
                      <b className="tnum">{p.durationLabel}</b>
                      <span className="meta meta--dim">{p.dateLabel}</span>
                    </div>
                    <span className="prow__bar">
                      <i style={{ width: current ? "18%" : "0" }}></i>
                    </span>
                    <a className="prow__link" href={p.pageUrl} target="_blank" rel="noopener" aria-label={p.title}></a>
                  </article>
                );
              })}
            </div>
            <div className="row mt5" style={{ justifyContent: "center" }}>
              <a className="btn btn--line btn--lg" id="more" href={PODBEAN} target="_blank" rel="noopener">
                Load more episodes
              </a>
            </div>
          </div>
        </section>

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
            <div className="grid g3" data-rv="80" data-stagger="">
                {YOUTUBE_SHORTS.map((clip) => (
                  <a
                    className="card card--link"
                    href={`https://www.youtube.com/shorts/${clip.id}`}
                    target="_blank"
                    rel="noopener"
                    key={clip.id}
                  >
                    <div style={{ margin: "calc(-1 * clamp(20px,2.4vw,32px)) calc(-1 * clamp(20px,2.4vw,32px)) 0" }}>
                      <Shot
                        variant={clip.v}
                        ratio="16-9"
                        label="YouTube"
                        note="Opens on YouTube"
                        src={`https://i.ytimg.com/vi/${clip.id}/hqdefault.jpg`}
                      />
                    </div>
                    <p className="card__n mt5">Short</p>
                    <h3 className="card__t">{clip.t}</h3>
                  </a>
                ))}
              </div>
              <p className="row mt5" style={{ justifyContent: "center" }}>
                <a className="tlink" href={`${YOUTUBE_CHANNEL}/shorts`} target="_blank" rel="noopener">
                  All shorts on YouTube
                </a>
              </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap center">
            <p className="meta meta--gold">Subscribe</p>
            <h2 className="d2 mt3">Get every episode.</h2>
            <p className="lede mt3 dim mw" style={{ marginInline: "auto" }}>
              New ones land most weeks. Pick your app, or get the email.
            </p>
            <div className="subs meta mt5" style={{ justifyContent: "center" }}>
              <a href={PODBEAN} target="_blank" rel="noopener">
                Podbean
              </a>
              <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener">
                YouTube
              </a>
              <a href="https://feed.podbean.com/tda/feed.xml" target="_blank" rel="noopener">
                RSS feed
              </a>
            </div>
            <form
              className="row mt5"
              style={{ justifyContent: "center", flexWrap: "nowrap", maxWidth: 460, marginInline: "auto", gap: 10 }}
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="sr" htmlFor="nl">
                Email
              </label>
              <input className="input" id="nl" type="email" placeholder="you@example.com" />
              <button className="btn" type="submit" style={{ flex: "none" }}>
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
