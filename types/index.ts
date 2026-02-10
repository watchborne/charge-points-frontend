export type ChargePointId = string;
export type SiteId = string;

export type ChargePointLifecycle =
  | "OFFLINE"
  | "CONNECTED"
  | "SYNCED";

export type ChargePointStatus =
  | "Available"
  | "Preparing"
  | "Charging"
  | "SuspendedEV"
  | "SuspendedEVSE"
  | "Finishing"
  | "Reserved"
  | "Unavailable"
  | "Faulted";

export interface ChargePointMeta {
  vendor: string;
  model: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

export interface ChargePoint {
  id: ChargePointId;
  siteId: SiteId;
  lifecycle: ChargePointLifecycle;
  status: ChargePointStatus;
  lastSeen?: string; // ISO date string
  meta?: ChargePointMeta;
}

export interface Site {
  id: SiteId;
  name: string;
  chargePoints: ChargePointId[];
}
