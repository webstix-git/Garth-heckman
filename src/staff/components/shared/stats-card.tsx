import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  sky: {
    link: "text-foreground hover:text-foreground/70",
  },
  emerald: {
    link: "text-foreground hover:text-foreground/70",
  },
  violet: {
    link: "text-foreground hover:text-foreground/70",
  },
  orange: {
    link: "text-foreground hover:text-foreground/70",
  },
  blue: {
    link: "text-foreground hover:text-foreground/70",
  },
  teal: {
    link: "text-foreground hover:text-foreground/70",
  },
  rose: {
    link: "text-foreground hover:text-foreground/70",
  },
} as const;

export type StatsTone = keyof typeof TONES;

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  href?: string;
  linkLabel?: string;
  tone?: StatsTone;
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  href,
  linkLabel = "View all",
  tone = "sky",
  className,
}: StatsCardProps) {
  const colors = TONES[tone];

  return (
    <Card
      className={cn(
        "min-h-[152px] rounded-xl border border-[#dedee1] bg-white py-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-1">
        <CardTitle className="min-w-0 truncate text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="ml-3 size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5 pt-0 pb-5">
        <p className="font-heading text-[30px] leading-tight font-semibold tracking-tight tabular-nums">
          {value}
        </p>

        {href ? (
          <Link
            href={href}
            className={cn(
              "mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium",
              colors.link,
            )}
          >
            {linkLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
