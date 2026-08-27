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
    chargePointWithRanges: (chargePointId: string, ranges?: string[]) =>
      [...queryKeys.statusHistory.chargePoint(chargePointId), ...(ranges ? [ranges] : [])] as const,
  },
  securityEvents: {
    all: () => ["securityEvents"] as const,
    chargePoint: (chargePointId: string) =>
      [...queryKeys.securityEvents.all(), chargePointId] as const,
  },
  me: {
    all: () => ["me"] as const,
  },
  commissioningToken: {
    all: () => ["commissioningToken"] as const,
    status: () => [...queryKeys.commissioningToken.all(), "status"] as const,
  },
} as const;
