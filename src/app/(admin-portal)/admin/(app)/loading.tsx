import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-2 rounded-xl border p-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
