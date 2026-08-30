import { Skeleton } from "@watchborne/electrons";

import { SkeletonGrid } from "../../components/common/SkeletonGrid";

export const SiteGridSkeleton = () => {
  return (
    <SkeletonGrid
      className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
      count={6}
      renderItem={() => (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
      )}
    />
  );
};
