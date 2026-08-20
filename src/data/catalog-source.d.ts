export const CURRENCY: string;

export const TAXONOMY: {
  categories: Array<{
    slug: string;
    name: string;
    order: number;
    description: string;
    children?: Array<{ slug: string; name: string }>;
  }>;
  collections: Array<{ slug: string; name: string }>;
  productTypes: Array<{ slug: string; name: string }>;
};

export const PRODUCTS: Array<Record<string, unknown>>;
