import "server-only";
import { unstable_cache } from "next/cache";

const FEED = "https://feed.podbean.com/tda/feed.xml";
const FEED_LIMIT = 500;

export type PodcastEpisode = {
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
};

export type LatestEpisode = PodcastEpisode;

const FALLBACK: PodcastEpisode = {
  id: "now-that-hurt",
  title: "Now that hurt!",
  episodeNo: "1744",
  durationSeconds: 477,
  durationLabel: "07:57",
  audioUrl: "https://mcdn.podbean.com/mf/web/x9if3yfuipdakvp6/Untitled_-_8_17_26_712_PM9jpxq.mp3",
  pageUrl: "https://tda.podbean.com/e/now-that-hurt/",
  dateLabel: "17 Aug 26",
  summary: "Abraham lives in a spiritual world. Sarah lives in a physical one. Then God asks why she laughed.",
  imageUrl: "",
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function attrTag(xml: string, name: string, attr: string) {
  const match = xml.match(new RegExp(`<${name}[^>]*\\s${attr}="([^"]+)"`, "i"));
  return match ? decodeXml(match[1]) : "";
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
}

function parseDuration(raw: string) {
  const value = raw.trim();
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(value)) return Math.round(Number(value));
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatEpisodeDate(pubDate: string) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const dd = day < 10 ? `0${day}` : String(day);
  return `${dd} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function clip(text: string, max = 180) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 80 ? cut.slice(0, sp) : cut).trim()}…`;
}

function summaryFrom(item: string) {
  const subtitle = tag(item, "itunes:subtitle");
  const raw = subtitle || tag(item, "itunes:summary") || tag(item, "description");
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !/^(the david alliance|garth heckman|tdagiantslayer@gmail\.com)$/i.test(line))
    .join(" ")
    .trim();
  return clip(text);
}

async function readItems(res: Response, count: number) {
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let found = 0;
  let searchFrom = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    while (found < count) {
      const close = buf.indexOf("</item>", searchFrom);
      if (close === -1) break;
      found += 1;
      searchFrom = close + "</item>".length;
    }
    if (found >= count) {
      await reader.cancel();
      return buf.slice(0, searchFrom);
    }
    if (buf.length > 2_500_000) {
      await reader.cancel();
      throw new Error("RSS exceeded expected size");
    }
  }
  return buf;
}

function parseItem(item: string, cover: string): PodcastEpisode | null {
  const title = tag(item, "itunes:title") || tag(item, "title");
  if (!title) return null;
  const durationSeconds = parseDuration(tag(item, "itunes:duration")) || FALLBACK.durationSeconds;
  const audioUrl = attrTag(item, "enclosure", "url");
  const pageUrl = tag(item, "link") || FALLBACK.pageUrl;
  const guid = tag(item, "guid") || pageUrl || title;
  return {
    id: guid,
    title,
    episodeNo: tag(item, "itunes:episode"),
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    audioUrl: audioUrl || FALLBACK.audioUrl,
    pageUrl,
    dateLabel: formatEpisodeDate(tag(item, "pubDate")),
    summary: summaryFrom(item),
    imageUrl: attrTag(item, "itunes:image", "href") || cover,
  };
}

async function fetchEpisodes(count: number): Promise<PodcastEpisode[]> {
  const res = await fetch(FEED, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "GarthHeckman.com/1.0",
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Podbean RSS ${res.status}`);

  const xml = await readItems(res, count);
  const cover = attrTag(xml, "itunes:image", "href");
  const episodes = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .slice(0, count)
    .map((match) => parseItem(match[0], cover))
    .filter((ep): ep is PodcastEpisode => ep !== null);

  if (!episodes.length) throw new Error("Podbean RSS had no items");
  return episodes;
}

export const getRecentEpisodes = unstable_cache(
  async (): Promise<PodcastEpisode[]> => {
    try {
      return await fetchEpisodes(FEED_LIMIT);
    } catch {
      return [FALLBACK];
    }
  },
  ["tda-feed-episodes"],
  { revalidate: 1800 },
);

export const getLatestEpisode = unstable_cache(
  async (): Promise<PodcastEpisode> => {
    try {
      const [latest] = await fetchEpisodes(1);
      return latest ?? FALLBACK;
    } catch {
      return FALLBACK;
    }
  },
  ["tda-latest-episode"],
  { revalidate: 1800 },
);
