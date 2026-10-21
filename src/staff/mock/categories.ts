import type { Category } from "@/types";

const img = (seed: string) =>
  `https://picsum.photos/seed/${seed}/640/640`;

export const mockCategories: Category[] = [
  {
    id: "cat_books",
    name: "Books",
    slug: "books",
    image: img("cat-books"),
    description: "Print and digital titles, including WTFU and companion workbooks.",
    active: true,
    productCount: 4,
    createdAt: "2025-01-12T10:00:00.000Z",
  },
  {
    id: "cat_audio",
    name: "Audio",
    slug: "audio",
    image: img("cat-audio"),
    description: "Narrated editions and spoken companion pieces.",
    active: true,
    productCount: 2,
    createdAt: "2025-02-03T10:00:00.000Z",
  },
  {
    id: "cat_merch",
    name: "Merchandise",
    slug: "merchandise",
    image: img("cat-merch"),
    description: "Apparel and branded goods fulfilled through Printify.",
    active: true,
    productCount: 3,
    createdAt: "2025-02-18T10:00:00.000Z",
  },
  {
    id: "cat_training",
    name: "Training",
    slug: "training",
    image: img("cat-training"),
    description: "Workshop decks and facilitation materials.",
    active: true,
    productCount: 2,
    createdAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "cat_digital",
    name: "Digital Downloads",
    slug: "digital-downloads",
    image: img("cat-digital"),
    description: "PDFs and instant-access resources.",
    active: true,
    productCount: 2,
    createdAt: "2025-03-14T10:00:00.000Z",
  },
  {
    id: "cat_archive",
    name: "Archive",
    slug: "archive",
    image: img("cat-archive"),
    description: "Retired collections kept for historical orders.",
    active: false,
    productCount: 0,
    createdAt: "2024-11-20T10:00:00.000Z",
  },
];
