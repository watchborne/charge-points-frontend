import { AlertCircle } from "lucide-react";

export const ErrorCallout = ({ error }: { error: string }) => {
  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-red-800">
        <AlertCircle className="h-5 w-5" />
        <p className="font-medium">{error}</p>
      </div>
    </div>
  );
};
