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
  connection: {
    status: ChargePointConnectionStatus;
    lastSeen?: string;
  };
  status?: ChargePointStatus;
  meta?: ChargePointMeta;
}

export interface Site {
  id: SiteId;
  name: string;
  chargePoints: ChargePointId[];
}
