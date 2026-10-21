import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  active: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  published: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  paid: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  completed: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  synced: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  delivered: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  shipped: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  draft: "border-transparent bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  inactive: "border-transparent bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  archived: "border-transparent bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  pending: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  processing: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-400",
  fulfilled: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-400",
  in_production: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-400",
  read: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-400",
  new: "border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-400",
  responded: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "border-transparent bg-destructive/10 text-destructive",
  failed: "border-transparent bg-destructive/10 text-destructive",
  refunded: "border-transparent bg-orange-500/10 text-orange-700 dark:text-orange-400",
  unmapped: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  on_hold: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", TONE[status] ?? TONE.draft, className)}
    >
      {titleCase(status)}
    </Badge>
  );
}
