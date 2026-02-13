export type ChargePointId = string;
export type SiteId = string;

export type ChargePointConnectionStatus = "OFFLINE" | "CONNECTED" | "SYNCED";

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
  chargePointVendor: string;
  chargePointModel: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

export interface ChargePoint {
  id: ChargePointId;
  siteId: SiteId;
  lifecycle: ChargePointConnectionStatus;
  status: ChargePointStatus;
  lastSeen?: string; // ISO date string
  meta?: ChargePointMeta;
}

export interface Site {
  id: SiteId;
  name: string;
  chargePoints: ChargePointId[];
}
