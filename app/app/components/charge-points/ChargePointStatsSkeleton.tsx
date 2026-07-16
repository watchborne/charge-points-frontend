import { Skeleton } from "../common/Skeleton";

export const ChargePointStatsSkeleton = () => {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card rounded-lg border p-4 flex flex-col content-stretch">
          <div className="flex items-center justify-between mb-2 gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
};
