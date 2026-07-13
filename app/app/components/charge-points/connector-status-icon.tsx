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

import { ConnectorStatus } from "@/types/charge-point";

export const getConnectorStatusIcon = (status: ConnectorStatus, size = "18px") => {
  switch (status) {
    case "Available":
      return <CheckCircle size={size} className="text-st-available-700" />;
    case "Preparing":
      return <CircleEllipsis size={size} className="text-st-charging-700" />;
    case "Charging":
    case "Occupied":
      return <PlugZap size={size} className="text-st-charging-700" />;
    case "SuspendedEV":
    case "SuspendedEVSE":
      return <Pause size={size} className="text-st-charging-700" />;
    case "Finishing":
      return <Loader size={size} className="text-st-charging-700" />;
    case "Reserved":
      return <Ticket size={size} className="text-st-maint-700" />;
    case "Unavailable":
      return <X size={size} className="text-st-offline-700" />;
    case "Faulted":
      return <Shield size={size} className="text-st-error-700" />;
  }
};
