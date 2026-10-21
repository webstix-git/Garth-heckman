import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const headingIconTileClass =
  "flex shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] dark:bg-white/10 dark:text-white";

interface SectionCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn("gap-0 overflow-hidden rounded-xl bg-background py-0", className)}>
      <CardHeader className="border-b bg-muted/45 py-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className={cn(headingIconTileClass, "size-9")}>
              <Icon className="size-4" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{title}</CardTitle>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("pt-5 pb-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
