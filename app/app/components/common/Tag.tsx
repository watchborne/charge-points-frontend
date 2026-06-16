export const Tag = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded">
      {children}
    </span>
  );
};
