import { PropsWithChildren } from "react";

import { Card } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
} & PropsWithChildren;

export const StatCard = ({ title, value, icon, subtitle, children }: StatCardProps) => {
  return (
    <Card className="p-4 flex flex-col content-stretch">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {children}
    </Card>
  );
};
