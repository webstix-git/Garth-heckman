"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

export function NavPendingMark() {
  const { pending } = useLinkStatus();

  return (
    <>
      <span data-pending={pending ? "true" : "false"} className="sr-only" />
      <Loader2
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-1.5 size-3.5 animate-spin text-current transition-opacity duration-150",
          pending ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}
