export const Tag = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-secondary-foreground bg-secondary rounded">
      {children}
    </span>
  );
};
