"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function NavigationProgressBar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const routeKey = `${pathname}?${search}`;
  const [phase, setPhase] = useState<"idle" | "loading" | "finishing">("idle");
  const pendingRef = useRef(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const nextKey = `${url.pathname}?${url.searchParams.toString()}`;
      if (nextKey === `${pathname}?${search}`) return;
      pendingRef.current = true;
      setPhase("loading");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, search]);

  useEffect(() => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    setPhase("finishing");
    const timeout = window.setTimeout(() => setPhase("idle"), 280);
    return () => window.clearTimeout(timeout);
  }, [routeKey]);

  if (phase === "idle") return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
      role="progressbar"
      aria-hidden
    >
      <div
        className={cn(
          "h-full origin-left bg-foreground transition-[transform,opacity] duration-300 ease-out",
          phase === "loading" ? "animate-nav-progress opacity-100" : "scale-x-100 opacity-0",
        )}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
