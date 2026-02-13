import { ChargePointStatus, ChargePointLifecycle } from "@/types";

interface StatusBadgeProps {
  status: ChargePointStatus;
  lifecycle: ChargePointLifecycle;
}

export const StatusBadge = ({ status, lifecycle }: StatusBadgeProps) => {
  const getColor = () => {
    if (lifecycle === "OFFLINE") return "bg-gray-500";
    if (lifecycle === "CONNECTED") return "bg-yellow-500";

    switch (status) {
      case "Available":
        return "bg-green-500";
      case "Charging":
        return "bg-blue-500";
      case "Faulted":
        return "bg-red-500";
      case "Unavailable":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLabel = () => {
    if (lifecycle === "OFFLINE") return "Hors ligne";
    if (lifecycle === "CONNECTED") return "Connexion...";

    switch (status) {
      case "Available":
        return "Disponible";
      case "Charging":
        return "En charge";
      case "Preparing":
        return "Préparation";
      case "Finishing":
        return "Finalisation";
      case "Faulted":
        return "En panne";
      case "Unavailable":
        return "Indisponible";
      case "Reserved":
        return "Réservé";
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getColor()}`}
    >
      {getLabel()}
    </span>
  );
};
