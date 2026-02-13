import { Battery } from "lucide-react";

export const EmptyStateChargePoints = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <Battery className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 font-medium">No detected charge points</p>
      <p className="text-sm text-gray-500 mt-2">
        Charge points will appear here once connected to the OCPP server
      </p>
    </div>
  );
};
