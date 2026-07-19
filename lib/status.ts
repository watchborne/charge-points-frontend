import { ChargePointConnectionStatus, ConnectorStatus } from "@/types/charge-point";

/**
 * Charge-point status design tokens.
 *
 * Both the network connection status and the OCPP connector status collapse
 * onto a shared, finite set of visual "tones". Each tone is backed by the
 * `--status-*` CSS variables (see `app/design-system/tokens.css`) and exposed
 * through Tailwind's `status-<tone>` colour family. Components must colour
 * statuses through the class maps below rather than hardcoding raw colours, so
 * the marketing site and the app stay in sync.
 */
export type StatusTone =
  "available" | "charging" | "pending" | "warning" | "error" | "offline" | "reserved";

/** Network connectivity of a station (`ChargePoint.connection.status`). */
export const connectionStatusTone = (status: ChargePointConnectionStatus): StatusTone => {
  switch (status) {
    case "SYNCED":
      return "available";
    case "CONNECTED":
      return "pending";
    case "WARNING":
      return "warning";
    case "OFFLINE":
      return "offline";
    default:
      return "offline";
  }
};

/** Live OCPP state of a single connector (`Connector.status`). */
export const connectorStatusTone = (status: ConnectorStatus): StatusTone => {
  switch (status) {
    case "Available":
      return "available";
    case "Charging":
    case "Occupied":
    case "Finishing":
      return "charging";
    case "Preparing":
    case "SuspendedEV":
    case "SuspendedEVSE":
      return "pending";
    case "Reserved":
      return "reserved";
    case "Unavailable":
      return "warning";
    case "Faulted":
      return "error";
    default:
      return "offline";
  }
};

/** Soft pill styling: tinted background + accessible foreground text. */
export const toneBadgeClass: Record<StatusTone, string> = {
  available: "bg-status-available-soft text-status-available-foreground",
  charging: "bg-status-charging-soft text-status-charging-foreground",
  pending: "bg-status-pending-soft text-status-pending-foreground",
  warning: "bg-status-warning-soft text-status-warning-foreground",
  error: "bg-status-error-soft text-status-error-foreground",
  offline: "bg-status-offline-soft text-status-offline-foreground",
  reserved: "bg-status-reserved-soft text-status-reserved-foreground",
};

/** Solid dot / indicator fill. */
export const toneDotClass: Record<StatusTone, string> = {
  available: "bg-status-available",
  charging: "bg-status-charging",
  pending: "bg-status-pending",
  warning: "bg-status-warning",
  error: "bg-status-error",
  offline: "bg-status-offline",
  reserved: "bg-status-reserved",
};

/** Icon / text colour on a light surface (AA on white). */
export const toneTextClass: Record<StatusTone, string> = {
  available: "text-status-available-foreground",
  charging: "text-status-charging-foreground",
  pending: "text-status-pending-foreground",
  warning: "text-status-warning-foreground",
  error: "text-status-error-foreground",
  offline: "text-status-offline-foreground",
  reserved: "text-status-reserved-foreground",
};
