import { cn } from "@/lib/utils";

export const countBadgeClass =
  "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-center text-[11px] font-bold leading-none tabular-nums text-white shadow-sm ring-1 ring-white/35";

export function CountBadge({
  value,
  compact,
  className,
}: {
  value: string | number;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span
        className={cn("absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 shadow-sm ring-2 ring-sidebar", className)}
        aria-label={`${value} new`}
      />
    );
  }

  return <span className={cn(countBadgeClass, className)}>{value}</span>;
}
