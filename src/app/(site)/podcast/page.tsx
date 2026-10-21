import { getRecentEpisodes } from "@/lib/podcast";
import { PodcastClient } from "./PodcastClient";

export default async function PodcastPage() {
  const episodes = await getRecentEpisodes();
  return <PodcastClient episodes={episodes} />;
}
