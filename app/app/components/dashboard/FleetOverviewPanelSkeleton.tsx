import { Skeleton } from "../common/Skeleton";

export const FleetOverviewPanelSkeleton = () => {
  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      <div className="grid md:grid-cols-3">
        {/* Left sidebar - sites list */}
        <div className="border-b bg-muted/30 p-4 sm:p-6 md:border-b-0 md:border-r">
          <Skeleton className="h-4 w-16 mb-6" />

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4 bg-background overflow-hidden">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-20 mb-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Right content - charge points list */}
        <div className="p-4 sm:p-6 md:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-7 w-48" />
          </div>

          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <div className="flex w-full flex-wrap items-center justify-between gap-2 p-4">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
