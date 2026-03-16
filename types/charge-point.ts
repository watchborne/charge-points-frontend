export type ChargePointId = string;
export type ChargePointLogId = string;
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

export interface ChargePointLog {
  uuid: ChargePointLogId;
  timestamp: Date;
  action: string;
  payload: Record<string, unknown>;
}

export interface ChargePoint {
  uuid: ChargePointId;
  name: string;
  isActive: boolean;
  siteId: SiteId;
  connection: {
    status: ChargePointConnectionStatus;
    lastSeen?: string;
  };
  status?: ChargePointStatus;
  meta?: ChargePointMeta;
}
