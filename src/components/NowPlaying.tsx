"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BARS = 92;

function pad(n: number) {
  return (n < 10 ? "0" : "") + n;
}
function fmt(s: number) {
  return pad(Math.floor(s / 60)) + ":" + pad(Math.floor(s % 60));
}

function barHeights() {
  const out: number[] = [];
  for (let i = 0; i < BARS; i++) {
    const h =
      22 +
      Math.round(
        30 * Math.abs(Math.sin(i * 0.31)) +
          26 * Math.abs(Math.sin(i * 0.11 + 1.2)) +
          20 * Math.abs(Math.sin(i * 0.73 + 0.4)),
      );
    out.push(Math.min(100, h));
  }
  return out;
}

export function NowPlaying({
  title,
  kicker,
  durationSeconds,
  audioUrl,
  autoPlay = false,
  showAll = true,
  playing: playingProp,
  onPlayingChange,
}: {
  title: string;
  kicker: string;
  durationSeconds: number;
  audioUrl?: string;
  autoPlay?: boolean;
  showAll?: boolean;
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const heights = useMemo(() => barHeights(), []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | null>(null);
  const [pos, setPos] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [duration, setDuration] = useState(durationSeconds);
  const controlled = playingProp !== undefined;
  const playing = controlled ? playingProp : localPlaying;

  function setPlaying(next: boolean) {
    if (!controlled) setLocalPlaying(next);
    onPlayingChange?.(next);
  }

  useEffect(() => {
    setPos(0);
    setDuration(durationSeconds);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [title, audioUrl, durationSeconds]);

  useEffect(() => {
    if (controlled || !autoPlay) return;
    setLocalPlaying(true);
  }, [autoPlay, audioUrl, controlled]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (playing) {
      void el.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPlaying(false);
      });
    } else {
      el.pause();
    }
  }, [playing, audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    const onTime = () => setPos(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setPos(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl || !playing) {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      return;
    }
    timer.current = window.setInterval(() => {
      setPos((p) => {
        const n = p + 1;
        if (n >= duration) {
          setPlaying(false);
          return 0;
        }
        return n;
      });
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, audioUrl, duration]);

  const idx = duration > 0 ? Math.floor((pos / duration) * BARS) : 0;

  function seekTo(v: number) {
    const next = Math.max(0, Math.min(duration, v));
    setPos(next);
    if (audioRef.current) audioRef.current.currentTime = next;
  }

  function toggle() {
    setPlaying(!playing);
  }

  return (
    <div className={`np${playing ? " playing" : ""}`} id="np">
      {audioUrl ? <audio ref={audioRef} className="sr" src={audioUrl} preload="metadata" /> : null}
      <button
        className="np__play"
        id="npPlay"
        type="button"
        aria-label={playing ? "Pause" : "Play latest episode"}
        aria-pressed={playing}
        onClick={() => void toggle()}
      >
        <svg className="ic-play" width="19" height="19" viewBox="0 0 19 19" fill="currentColor" aria-hidden="true">
          <path d="M6 3.6v11.8l10-5.9z" />
        </svg>
        <svg className="ic-pause" width="17" height="17" viewBox="0 0 17 17" fill="currentColor" aria-hidden="true">
          <rect x="3.5" y="2.5" width="3.6" height="12" />
          <rect x="9.9" y="2.5" width="3.6" height="12" />
        </svg>
      </button>
      <div className="np__body">
        <p className="meta" style={{ color: "var(--gold)" }}>
          {kicker}
        </p>
        <p className="np__title">{title}</p>
        <div
          className="wave"
          id="wave"
          role="slider"
          tabIndex={0}
          aria-label="Seek within episode"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={duration > 0 ? Math.round((pos / duration) * 100) : 0}
          aria-valuetext={`${fmt(pos)} of ${fmt(duration)}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - r.left) / r.width) * duration);
          }}
          onKeyDown={(e) => {
            const step = duration / 100;
            let d = 0;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") d = step;
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -step;
            else if (e.key === "PageUp") d = step * 10;
            else if (e.key === "PageDown") d = -step * 10;
            else if (e.key === "Home") {
              e.preventDefault();
              return seekTo(0);
            } else if (e.key === "End") {
              e.preventDefault();
              return seekTo(duration);
            } else return;
            e.preventDefault();
            seekTo(pos + d);
          }}
        >
          {heights.map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} className={i < idx ? "on" : i === idx ? "cur" : ""} />
          ))}
        </div>
      </div>
      <div className="np__right">
        <span className="meta meta--dim tnum" id="npTime">
          {fmt(pos)} / {fmt(duration)}
        </span>
        {showAll ? (
          <a className="tlink" href="/podcast">
            All episodes
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : null}
      </div>
    </div>
  );
}
