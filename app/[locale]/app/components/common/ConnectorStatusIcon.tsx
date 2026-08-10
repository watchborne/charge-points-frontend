import {
  CheckCircle,
  CircleEllipsis,
  Loader,
  Pause,
  PlugZap,
  Shield,
  Ticket,
  X,
} from "lucide-react";

import { connectorStatusTone, toneTextClass } from "@/lib/status";
import { ConnectorStatus } from "@/types/charge-point";

interface ConnectorStatusIconProps {
  status: ConnectorStatus;
  size?: number;
}

export const ConnectorStatusIcon = ({ status, size = 16 }: ConnectorStatusIconProps) => {
  const className = toneTextClass[connectorStatusTone(status)];

  switch (status) {
    case "Available":
      return <CheckCircle size={size} className={className} />;
    case "Preparing":
      return <CircleEllipsis size={size} className={className} />;
    case "Charging":
    case "Occupied":
      return <PlugZap size={size} className={className} />;
    case "SuspendedEV":
    case "SuspendedEVSE":
      return <Pause size={size} className={className} />;
    case "Finishing":
      return <Loader size={size} className={className} />;
    case "Reserved":
      return <Ticket size={size} className={className} />;
    case "Unavailable":
      return <X size={size} className={className} />;
    case "Faulted":
      return <Shield size={size} className={className} />;
    default:
      return null;
  }
};
