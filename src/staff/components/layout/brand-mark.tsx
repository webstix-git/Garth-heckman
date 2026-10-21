"use client";

import Image from "next/image";

import { useStoreBrand } from "@/components/providers/store-brand-provider";
import { APP_LOGO_SRC, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function GoldShield({ className }: { className?: string }) {
  const { settings, loading } = useStoreBrand();
  const src = settings.store.logoUrl || APP_LOGO_SRC;

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center transition-opacity dark:rounded-md dark:bg-white dark:p-0.5",
        loading && "opacity-0",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-contain" />
    </span>
  );
}

export function BrandMark({
  className,
  inverse = false,
  logoBackground = false,
}: {
  className?: string;
  inverse?: boolean;
  logoBackground?: boolean;
}) {
  const { settings, loading } = useStoreBrand();
  const name = settings.store.name || APP_NAME;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 transition-opacity",
        loading && "opacity-0",
        className,
      )}
    >
      <GoldShield className={cn("size-9", logoBackground && "rounded-md bg-white p-1")} />
      <p
        className={cn(
          "min-w-0 truncate text-[15px] leading-tight font-semibold",
          inverse ? "text-white" : "text-zinc-800 dark:text-white",
        )}
      >
        {name}
      </p>
    </div>
  );
}

/** Kept for any Image-based usages that still need next/image. */
export function BrandLogoImage({ className }: { className?: string }) {
  const { settings } = useStoreBrand();
  return (
    <Image
      src={settings.store.logoUrl || APP_LOGO_SRC}
      alt={settings.store.name || APP_NAME}
      width={516}
      height={407}
      className={cn("object-contain", className)}
    />
  );
}
