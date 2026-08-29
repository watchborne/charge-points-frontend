import { Skeleton } from "@watchborne/electrons";

interface SkeletonGridProps {
  columns?: 2 | 3 | 4;
  count?: number;
  cellHeight?: string;
}

export const SkeletonGrid = ({
  columns = 4,
  count = 4,
  cellHeight = "h-24",
}: SkeletonGridProps) => {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${colsClass[columns]} w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${cellHeight} rounded-lg`}>
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
};
