/**
 * Centralized helpers for status display logic and mappings.
 * Single source of truth for status-to-icon/color/label conversions.
 */

import type { ChargePointConnectionStatus, ConnectorStatus } from "@/types/charge-point";

export const chargePointConnectionStatusDisplay: Record<
  ChargePointConnectionStatus,
  { label: string; icon: string; tone: "available" | "warning" | "error" | "offline" }
> = {
  CONNECTED: {
    label: "Connected",
    icon: "check-circle",
    tone: "available",
  },
  DISCONNECTED: {
    label: "Disconnected",
    icon: "alert-circle",
    tone: "offline",
  },
  ERROR: {
    label: "Error",
    icon: "x-circle",
    tone: "error",
  },
};

export const connectorStatusDisplay: Record<
  ConnectorStatus,
  { label: string; icon: string; tone: "available" | "warning" | "error" | "offline" }
> = {
  AVAILABLE: {
    label: "Available",
    icon: "check-circle",
    tone: "available",
  },
  OCCUPIED: {
    label: "Occupied",
    icon: "alert-circle",
    tone: "warning",
  },
  RESERVED: {
    label: "Reserved",
    icon: "lock",
    tone: "warning",
  },
  UNAVAILABLE: {
    label: "Unavailable",
    icon: "x-circle",
    tone: "error",
  },
  FAULTED: {
    label: "Faulted",
    icon: "alert-triangle",
    tone: "error",
  },
};

export const alertLevelDisplay: Record<
  string,
  { label: string; icon: string; tone: "available" | "warning" | "error" }
> = {
  INFO: {
    label: "Info",
    icon: "info",
    tone: "available",
  },
  WARNING: {
    label: "Warning",
    icon: "alert-circle",
    tone: "warning",
  },
  ERROR: {
    label: "Error",
    icon: "x-circle",
    tone: "error",
  },
};

export const siteHealthDisplay: Record<
  string,
  { label: string; icon: string; tone: "available" | "warning" | "error" | "offline" }
> = {
  HEALTHY: {
    label: "Healthy",
    icon: "check-circle",
    tone: "available",
  },
  DEGRADED: {
    label: "Degraded",
    icon: "alert-circle",
    tone: "warning",
  },
  UNHEALTHY: {
    label: "Unhealthy",
    icon: "x-circle",
    tone: "error",
  },
  UNKNOWN: {
    label: "Unknown",
    icon: "help-circle",
    tone: "offline",
  },
};

export function getConnectionStatusDisplay(status: ChargePointConnectionStatus) {
  return chargePointConnectionStatusDisplay[status];
}

export function getConnectorStatusDisplay(status: ConnectorStatus) {
  return connectorStatusDisplay[status];
}

export function getAlertLevelDisplay(level: string) {
  return alertLevelDisplay[level] || alertLevelDisplay.INFO;
}

export function getSiteHealthDisplay(health: string) {
  return siteHealthDisplay[health] || siteHealthDisplay.UNKNOWN;
}
