import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "This data could not be loaded. Try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <h3 className="font-heading text-sm font-medium">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
