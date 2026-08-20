"use client";

import { Catalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export function TripleCGrid() {
  const list = Catalog.all().filter((p) => p.status === "active" && (p.collections || []).indexOf("triple-c") > -1);
  return (
    <>
      {list.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </>
  );
}
