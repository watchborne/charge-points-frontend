export const queryKeys = {
  chargePoints: {
    all: () => ["chargePoints"] as const,
    lists: () => [...queryKeys.chargePoints.all(), "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.chargePoints.lists(), ...(filters ? [filters] : [])] as const,
    details: () => [...queryKeys.chargePoints.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.chargePoints.details(), id] as const,
  },
  sites: {
    all: () => ["sites"] as const,
    lists: () => [...queryKeys.sites.all(), "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.sites.lists(), ...(filters ? [filters] : [])] as const,
    details: () => [...queryKeys.sites.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.sites.details(), id] as const,
  },
  sitesHealth: {
    all: () => ["sitesHealth"] as const,
    list: (siteIds?: string[]) =>
      [...queryKeys.sitesHealth.all(), ...(siteIds ? [siteIds] : [])] as const,
  },
  metering: {
    all: () => ["metering"] as const,
    samples: () => [...queryKeys.metering.all(), "samples"] as const,
    sample: (chargePointId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.metering.samples(), chargePointId, ...(filters ? [filters] : [])] as const,
    consumption: () => [...queryKeys.metering.all(), "consumption"] as const,
    consumptionByChargePoint: (chargePointId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.metering.consumption(), chargePointId, ...(filters ? [filters] : [])] as const,
  },
  statusHistory: {
    all: () => ["statusHistory"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.statusHistory.all(), chargePointId] as const,
    chargePointWithRanges: (chargePointId: string, filters?: string[]) =>
      [
        ...queryKeys.statusHistory.chargePoint(chargePointId),
        ...(filters ? [filters] : []),
      ] as const,
  },
  securityEvents: {
    all: () => ["securityEvents"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.securityEvents.all(), chargePointId] as const,
  },
  siteVisits: {
    all: () => ["siteVisits"] as const,
    site: (siteId: string) => [...queryKeys.siteVisits.all(), siteId] as const,
  },
  siteVisitSchedule: {
    all: () => ["siteVisitSchedule"] as const,
    site: (siteId: string) => [...queryKeys.siteVisitSchedule.all(), siteId] as const,
  },
  firmwareCampaigns: {
    all: () => ["firmwareCampaigns"] as const,
    lists: () => [...queryKeys.firmwareCampaigns.all(), "list"] as const,
    details: () => [...queryKeys.firmwareCampaigns.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.firmwareCampaigns.details(), id] as const,
  },
  me: {
    all: () => ["me"] as const,
  },
  commissioningToken: {
    all: () => ["commissioningToken"] as const,
    status: () => [...queryKeys.commissioningToken.all(), "status"] as const,
  },
  notificationPreferences: {
    all: () => ["notificationPreferences"] as const,
  },
  deviceEvents: {
    all: () => ["deviceEvents"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.deviceEvents.all(), chargePointId] as const,
  },
  deviceVariableReports: {
    all: () => ["deviceVariableReports"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.deviceVariableReports.all(), chargePointId] as const,
  },
  displayMessages: {
    all: () => ["displayMessages"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.displayMessages.all(), chargePointId] as const,
  },
  firmware: {
    all: () => ["firmware"] as const,
    chargePoint: (chargePointId: string) => [...queryKeys.firmware.all(), chargePointId] as const,
  },
  logUpload: {
    all: () => ["logUpload"] as const,
    chargePoint: (chargePointId: string) => [...queryKeys.logUpload.all(), chargePointId] as const,
    history: (chargePointId: string) =>
      [...queryKeys.logUpload.chargePoint(chargePointId), "history"] as const,
  },
  alerts: {
    all: () => ["alerts"] as const,
    chargePoint: (chargePointId: string) => [...queryKeys.alerts.all(), chargePointId] as const,
  },
  chargingSessions: {
    all: () => ["chargingSessions"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.chargingSessions.all(), chargePointId] as const,
  },
  uptime: {
    all: () => ["uptime"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.uptime.all(), "chargePoint", chargePointId] as const,
    site: (siteId: string) => [...queryKeys.uptime.all(), "site", siteId] as const,
  },
  fleetReliability: {
    all: () => ["fleetReliability"] as const,
  },
  settings: {
    all: () => ["settings"] as const,
    chargePoint: (chargePointId: string) => [...queryKeys.settings.all(), chargePointId] as const,
  },
  consumption: {
    all: () => ["consumption"] as const,
    session: (
      chargePointId: string,
      connectorId: number,
      startedAt: string,
      endedAt: string | null,
    ) =>
      [
        ...queryKeys.consumption.all(),
        "session",
        chargePointId,
        connectorId,
        startedAt,
        endedAt,
      ] as const,
  },
} as const;
