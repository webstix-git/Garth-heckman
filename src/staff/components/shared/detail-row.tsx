import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value?: ReactNode;
  className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
  return (
    <div
      className={cn(
        "grid gap-1 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4",
        className,
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{value ?? "—"}</dd>
    </div>
  );
}
