import { ChargePointConnectionStatus } from "@/types/charge-point";

interface StatusBadgeProps {
  status: ChargePointConnectionStatus;
  // lifecycle: ChargePointStatus;
}

export const StatusBadge = ({
  status,
  // lifecycle
}: StatusBadgeProps) => {
  const getColor = () => {
    if (status === "OFFLINE") return "bg-red-500";
    if (status === "CONNECTED") return "bg-orange-500";
    else return "bg-green-500";

    // switch (status) {
    //   case "Available":
    //     return "bg-green-500";
    //   case "Charging":
    //     return "bg-blue-500";
    //   case "Faulted":
    //     return "bg-red-500";
    //   case "Unavailable":
    //     return "bg-orange-500";
    //   default:
    //     return "bg-gray-500";
    // }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white ${getColor()}`}
    >
      {status.toLowerCase()}
    </span>
  );
};
