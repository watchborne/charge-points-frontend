import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

/**
 * The closed set of audited actions (charge-points-server ADR 0026 §4).
 * Server-local, like `SecurityEvent`/`SiteVisitSchedule`: no client consumes
 * this as a domain entity, only through this response shape.
 */
export const AUDIT_ACTIONS = [
  // Outbound OCPP commands (both dialects)
  "CHARGE_POINT_RESET",
  "CHARGE_POINT_CHANGE_AVAILABILITY",
  "CONNECTOR_UNLOCK",
  "CHARGE_POINT_CONFIGURATION_READ",
  "CHARGE_POINT_CONFIGURATION_WRITE",
  "CHARGE_POINT_TRIGGER_MESSAGE",
  "CHARGE_POINT_FIRMWARE_UPDATE",
  "CHARGE_POINT_LOG_UPLOAD_START",
  "CHARGE_POINT_GET_BASE_REPORT",
  "CHARGE_POINT_GET_REPORT",
  "CHARGE_POINT_SET_DISPLAY_MESSAGE",
  "CHARGE_POINT_CLEAR_DISPLAY_MESSAGE",
  "CHARGE_POINT_GET_DISPLAY_MESSAGES",
  "CHARGE_POINT_INSTALL_CERTIFICATE",
  "CHARGE_POINT_DELETE_CERTIFICATE",
  "CHARGE_POINT_GET_INSTALLED_CERTIFICATES",

  // REST writes
  "CHARGE_POINT_CREATED",
  "CHARGE_POINT_UPDATED",
  "CHARGE_POINT_DELETED",
  "CHARGE_POINT_ACTIVATION_SET",
  "SITE_CREATED",
  "SITE_UPDATED",
  "SITE_DELETED",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_DELETED",
  "SITE_TARIFF_SET",
  "ALERT_ACKNOWLEDGED",
  "COMMISSIONING_TOKEN_ISSUED",
  "FIRMWARE_CAMPAIGN_CREATED",
  "FIRMWARE_CAMPAIGN_CANCELLED",
  "SITE_VISIT_LOGGED",
  "SITE_VISIT_SCHEDULED",
  "SITE_VISIT_SCHEDULE_CANCELLED",
  "NOTIFICATION_PREFERENCES_SET",

  // Security-relevant events
  "COMMISSIONING_TOKEN_CLAIMED",
  "MEMBERSHIP_GRANTED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_OUTCOMES = ["PENDING", "SUCCEEDED", "REJECTED", "FAILED", "TIMED_OUT"] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export const AUDIT_ACTOR_SYSTEM_SOURCES = [
  "WATCHDOG",
  "SCHEDULER",
  "FIRMWARE_CAMPAIGN",
  "REPORT_AUTO_SEND",
  "OCPP_STATION",
] as const;
export type AuditActorSystemSource = (typeof AUDIT_ACTOR_SYSTEM_SOURCES)[number];

/** Mirrors `AccessScope`/`SYSTEM_SCOPE`: a person snapshot, or a named system source. */
export type AuditActor =
  | { kind: "USER"; userId: string; email: string }
  | { kind: "SYSTEM"; source: AuditActorSystemSource };

/** Exactly one of the three is set per entry, the others `null`. */
export type AuditTarget = {
  chargePointId: string | null;
  siteId: string | null;
  customerId: string | null;
};

export type AuditEntry = {
  id: string;
  /** ISO 8601 — when the entry was opened, not when it completed. */
  occurredAt: string;
  actor: AuditActor;
  action: AuditAction;
  target: AuditTarget;
  /** Redacted per action's allow-list (ADR 0026 §5) — never contains secrets. */
  payload: Record<string, unknown>;
  outcome: AuditOutcome;
  outcomeDetail: string | null;
  correlationId: string | null;
  /** ISO 8601, or `null` while `PENDING`. */
  completedAt: string | null;
};

export type AuditEntryPage = {
  items: AuditEntry[];
  /** Opaque; pass back as `cursor` to fetch the next page. `null` once exhausted. */
  nextCursor: string | null;
};

/** Filters shared by both reads below, mirroring the backend's `AuditEntryFilterQuerySchema`. */
export type AuditEntryFilters = {
  from?: Date;
  to?: Date;
  actorUserId?: string;
  action?: AuditAction;
  outcome?: AuditOutcome;
  cursor?: string;
  limit?: number;
};

/** `GET /api/audit`'s filters: the per-charge-point read's filters plus a target narrower. */
export type ListAuditEntriesFilters = AuditEntryFilters & {
  siteId?: string;
  customerId?: string;
};

const buildQuery = (filters?: Record<string, unknown>): string => {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, value instanceof Date ? value.toISOString() : String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const auditApis = {
  listForChargePoint: async (
    chargePointId: string,
    filters?: AuditEntryFilters,
  ): Promise<AuditEntryPage> => {
    return withErrorLogging(
      () =>
        httpClient.get<AuditEntryPage>(
          `/api/charge-points/${chargePointId}/audit${buildQuery(filters)}`,
        ),
      `Audit.listForChargePoint(${chargePointId})`,
    );
  },

  list: async (filters?: ListAuditEntriesFilters): Promise<AuditEntryPage> => {
    return withErrorLogging(
      () => httpClient.get<AuditEntryPage>(`/api/audit${buildQuery(filters)}`),
      "Audit.list",
    );
  },

  /** Builds the `/api/audit.csv` URL for a plain navigation/anchor download — not a `fetch`. */
  csvExportUrl: (filters?: Omit<ListAuditEntriesFilters, "cursor" | "limit">): string =>
    `/api/audit.csv${buildQuery(filters)}`,
};
