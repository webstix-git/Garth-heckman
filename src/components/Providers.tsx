"use client";

import { CartProvider } from "@/components/CartProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
