import { AlertStatus, SiteHealthStatus } from "@watchborne/charge-points-types";
import type { ColorName } from "@watchborne/electrons";

import { ChargePointConnectionStatus, ConnectorStatus } from "@/types/charge-point";

/**
 * Charge-point status design tokens.
 *
 * Both the network connection status and the OCPP connector status collapse
 * onto a shared, finite set of visual colors — `ColorName`, owned by
 * `@watchborne/electrons` rather than redeclared here. Each color is backed by
 * the `--<color>*` CSS variables (see `@watchborne/electrons`'s `tokens.css`)
 * and exposed through Tailwind's `<color>-*` colour family. Components must
 * colour statuses through the class maps below (or `ColorPill` directly) rather
 * than hardcoding raw colours, so the marketing site and the app stay in sync.
 */
export type { ColorName };

/** Every value `ChargePoint.connection.status` can take, for filter/select controls. */
export const CONNECTION_STATUSES: readonly ChargePointConnectionStatus[] = [
  "SYNCED",
  "CONNECTED",
  "WARNING",
  "OFFLINE",
];

/** Network connectivity of a station (`ChargePoint.connection.status`). */
export const connectionStatusColor = (status: ChargePointConnectionStatus): ColorName => {
  switch (status) {
    case "SYNCED":
      return "green";
    case "CONNECTED":
      return "amber";
    case "WARNING":
      return "orange";
    case "OFFLINE":
      return "gray";
    default:
      return "gray";
  }
};

/** Live OCPP state of a single connector (`Connector.status`). */
export const connectorStatusColor = (status: ConnectorStatus): ColorName => {
  switch (status) {
    case "Available":
      return "green";
    case "Charging":
    case "Occupied":
    case "Finishing":
      return "blue";
    case "Preparing":
    case "SuspendedEV":
    case "SuspendedEVSE":
      return "amber";
    case "Reserved":
      return "purple";
    case "Unavailable":
      return "orange";
    case "Faulted":
      return "red";
    default:
      return "gray";
  }
};

/** Aggregated per-site health bucket (`SiteHealth.status`). */
export const siteHealthStatusColor = (status: SiteHealthStatus): ColorName => {
  switch (status) {
    case "HEALTHY":
      return "green";
    case "DEGRADED":
      return "orange";
    case "CRITICAL":
      return "red";
    default:
      return "gray";
  }
};

/** An alert's lifecycle state (`Alert.status`): open needs attention, resolved doesn't. */
export const alertStatusColor = (status: AlertStatus): ColorName => {
  switch (status) {
    case "OPEN":
      return "red";
    case "RESOLVED":
      return "green";
    default:
      return "gray";
  }
};

/** Soft pill styling: tinted background + accessible foreground text. */
export const colorBadgeClass: Record<ColorName, string> = {
  green: "bg-green-soft text-green-foreground",
  blue: "bg-blue-soft text-blue-foreground",
  amber: "bg-amber-soft text-amber-foreground",
  orange: "bg-orange-soft text-orange-foreground",
  red: "bg-red-soft text-red-foreground",
  gray: "bg-gray-soft text-gray-foreground",
  purple: "bg-purple-soft text-purple-foreground",
};

/** Solid dot / indicator fill. */
export const colorDotClass: Record<ColorName, string> = {
  green: "bg-green",
  blue: "bg-blue",
  amber: "bg-amber",
  orange: "bg-orange",
  red: "bg-red",
  gray: "bg-gray",
  purple: "bg-purple",
};

/** Icon / text colour on a light surface (AA on white). */
export const colorTextClass: Record<ColorName, string> = {
  green: "text-green-foreground",
  blue: "text-blue-foreground",
  amber: "text-amber-foreground",
  orange: "text-orange-foreground",
  red: "text-red-foreground",
  gray: "text-gray-foreground",
  purple: "text-purple-foreground",
};

// Backward compatibility aliases for gradual migration
export const connectionStatusTone = connectionStatusColor;
export const connectorStatusTone = connectorStatusColor;
export const siteHealthStatusTone = siteHealthStatusColor;
export const alertStatusTone = alertStatusColor;
export const toneBadgeClass = colorBadgeClass;
export const toneDotClass = colorDotClass;
export const toneTextClass = colorTextClass;
