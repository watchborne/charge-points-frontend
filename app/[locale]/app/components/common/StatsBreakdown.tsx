import { StatCard } from "@watchborne/electrons";

export interface StatsBucket {
  label: string;
  icon?: React.ReactNode;
  value: number;
  subtitle?: string;
}

export interface StatsBreakdownProps {
  title: string;
  subtitle?: string;
  buckets: StatsBucket[];
  columns?: 2 | 3 | 4;
  /** Overrides the bucket grid's own layout classes, e.g. for a responsive column count. */
  className?: string;
}

export const StatsBreakdown = ({
  title,
  subtitle,
  buckets,
  columns = 4,
  className,
}: StatsBreakdownProps) => {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className={className ?? `grid gap-4 ${colsClass[columns]}`}>
        {buckets.map((bucket, index) => (
          <StatCard
            key={index}
            icon={bucket.icon}
            title={bucket.label}
            value={bucket.value}
            subtitle={bucket.subtitle}
          />
        ))}
      </div>
    </div>
  );
};
