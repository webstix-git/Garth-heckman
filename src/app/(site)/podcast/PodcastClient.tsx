"use client";

import { useState } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { NowPlaying } from "@/components/NowPlaying";
import { Shot } from "@/components/Shot";
import { YoutubeShortsClipsSection } from "@/components/YoutubeShortsClipsSection";
import { YOUTUBE_CHANNEL } from "@/lib/content";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const active = episodes.find((ep) => ep.id === activeId) ?? episodes[0];

  function toggleEpisode(id: string) {
    if (id === activeId && isPlaying) {
      setIsPlaying(false);
      return;
    }
    setActiveId(id);
    setIsPlaying(true);
  }

  return (
    <SiteChrome nav="podcast">
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
                playing={isPlaying}
                onPlayingChange={setIsPlaying}
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
                {episodes.length} episodes
              </p>
            </div>
            <div className="plist" id="list">
              {episodes.map((p, i) => {
                const current = p.id === active?.id;
                const rowPlaying = current && isPlaying;
                return (
                  <article className={`prow${rowPlaying ? " playing" : ""}`} key={p.id}>
                    <button
                      className="prow__play"
                      type="button"
                      aria-label={rowPlaying ? `Pause episode ${p.episodeNo || p.title}` : `Play episode ${p.episodeNo || p.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEpisode(p.id);
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
                      <i style={{ width: rowPlaying ? "18%" : "0" }}></i>
                    </span>
                    <button
                      className="prow__link"
                      type="button"
                      aria-label={rowPlaying ? `Pause ${p.title}` : `Play ${p.title}`}
                      onClick={() => toggleEpisode(p.id)}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <YoutubeShortsClipsSection />

        <section className="sec">
          <div className="wrap center">
            <p className="meta meta--gold">Subscribe</p>
            <h2 className="d2 mt3">Get every episode.</h2>
            <p className="lede mt3 dim mw" style={{ marginInline: "auto" }}>
              New ones land most weeks. Pick your app.
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
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
