"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { searchNavEntries, type NavSearchEntry } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => searchNavEntries(query, 8), [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goTo(entry: NavSearchEntry) {
    setOpen(false);
    setQuery("");
    router.push(entry.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter") && query.trim()) {
      setOpen(true);
    }

    if (!results.length) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const entry = results[activeIndex] ?? results[0];
      if (entry) goTo(entry);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-lg", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-white/60" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search menus…"
        className="h-9 rounded-lg border-white/15 bg-white/10 pr-4 pl-9 text-white shadow-none placeholder:text-white/55 focus-visible:border-white/30 focus-visible:ring-white/20"
        aria-label="Search admin menus"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showPanel}
        role="combobox"
      />

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          {results.length ? (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((entry, index) => {
                const Icon = entry.icon;
                const active = index === activeIndex;
                return (
                  <li key={entry.href} role="option" aria-selected={active}>
                    <Link
                      href={entry.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                        active ? "bg-muted" : "hover:bg-muted/70",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {Icon ? <Icon className="size-4" /> : <Search className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{entry.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.pathLabel}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No menu matches for “{query.trim()}”.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
