export type OcppAction =
  | "BootNotification"
  | "Heartbeat"
  | "StatusNotification"
  | "MeterValues"
  | "RemoteStartTransaction"
  | "RemoteStopTransaction"
  | "UnlockConnector"
  | "DataTransfer"
  | "FirmwareStatusNotification"
  | "DiagnosticsStatusNotification";
