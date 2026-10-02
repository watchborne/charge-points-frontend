import { Skeleton } from "@watchborne/electrons";

import { SkeletonGrid } from "../common/SkeletonGrid";

export const FleetReliabilityPanelSkeleton = () => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>

      <SkeletonGrid
        className="space-y-2"
        count={5}
        renderItem={() => (
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        )}
      />
    </div>
  );
};
