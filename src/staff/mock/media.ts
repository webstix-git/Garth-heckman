import type { MediaAsset } from "@/types";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

export const mockMedia: MediaAsset[] = [
  { id: "med_01", name: "wtfu-cover.jpg", url: img("wtfu-book"), type: "image", mimeType: "image/jpeg", size: 482_110, createdAt: "2026-04-02T14:12:00.000Z" },
  { id: "med_02", name: "wtfu-cover-alt.jpg", url: img("wtfu-book-2"), type: "image", mimeType: "image/jpeg", size: 391_002, createdAt: "2026-04-02T14:13:00.000Z" },
  { id: "med_03", name: "burn-pdf-thumb.jpg", url: img("burn-pdf"), type: "image", mimeType: "image/jpeg", size: 210_440, createdAt: "2026-05-11T11:00:00.000Z" },
  { id: "med_04", name: "audio-cover.jpg", url: img("wtfu-audio"), type: "image", mimeType: "image/jpeg", size: 333_891, createdAt: "2026-06-01T16:20:00.000Z" },
  { id: "med_05", name: "deck-hero.jpg", url: img("gen-deck"), type: "image", mimeType: "image/jpeg", size: 512_008, createdAt: "2026-07-09T10:00:00.000Z" },
  { id: "med_06", name: "tee-front.jpg", url: img("wtfu-tee"), type: "image", mimeType: "image/jpeg", size: 288_441, createdAt: "2026-08-20T12:00:00.000Z" },
  { id: "med_07", name: "hoodie-front.jpg", url: img("hoodie"), type: "image", mimeType: "image/jpeg", size: 301_220, createdAt: "2026-09-04T09:30:00.000Z" },
  { id: "med_08", name: "og-default.jpg", url: img("og-default"), type: "image", mimeType: "image/jpeg", size: 640_112, createdAt: "2026-01-10T08:00:00.000Z" },
  { id: "med_09", name: "brand-guidelines.pdf", url: "/files/brand-guidelines.pdf", type: "document", mimeType: "application/pdf", size: 1_204_800, createdAt: "2026-02-01T08:00:00.000Z" },
  { id: "med_10", name: "workshop-intro.mp4", url: "/files/workshop-intro.mp4", type: "video", mimeType: "video/mp4", size: 18_440_200, createdAt: "2026-03-18T08:00:00.000Z" },
  { id: "med_11", name: "mug-white.jpg", url: img("mug"), type: "image", mimeType: "image/jpeg", size: 198_330, createdAt: "2026-01-15T13:00:00.000Z" },
  { id: "med_12", name: "field-notes.jpg", url: img("field-notes"), type: "image", mimeType: "image/jpeg", size: 256_001, createdAt: "2026-03-02T15:45:00.000Z" },
];
