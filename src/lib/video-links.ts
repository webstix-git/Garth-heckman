/** Parse a YouTube Shorts / watch / youtu.be URL into a video id. */
export function extractYoutubeVideoId(raw: string): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
    if (host.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1] ?? "";
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] ?? "";
      }
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;
    }
  } catch {
    // fall through to regex
  }
  const match = value.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return match?.[1] ?? "";
}

export function youtubeThumbnailUrl(videoId: string): string {
  const id = String(videoId ?? "").trim();
  if (!id) return "";
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string): string {
  const id = String(videoId ?? "").trim();
  if (!id) return "";
  return `https://www.youtube.com/embed/${id}`;
}
