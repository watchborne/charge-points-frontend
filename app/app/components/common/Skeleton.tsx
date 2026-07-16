export const Skeleton = ({ className }: { className?: string }) => {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
};
