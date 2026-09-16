import { Skeleton } from "@watchborne/electrons";

/** Mirrors SiteGridSkeleton's row-count/shape for the campaigns table. */
export const FirmwareCampaignsListSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
};
