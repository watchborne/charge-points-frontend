import { PropsWithChildren } from "react";

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
} & PropsWithChildren;

export const StatCard = ({ title, value, icon, subtitle, children }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col content-stretch">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {children}
    </div>
  );
};
