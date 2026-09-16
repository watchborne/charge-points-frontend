import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// `FirmwareCampaign`'s response shape, as `POST`/`GET /api/firmware-campaigns`
// and `GET /api/firmware-campaigns/:id` return it. Not part of
// @watchborne/charge-points-types on purpose, exactly like `SiteVisitSchedule`
// in api-site-visits.ts: the backend keeps a fleet-wide firmware campaign
// server-local, since no client consumes it as a shared domain entity — the
// dashboard codes against this response contract instead. Timestamps arrive
// as ISO strings and are parsed where rendered, never widened to `Date` here.

export type FirmwareCampaignTargetMode = "SITE" | "LIST" | "FLEET";

export type FirmwareCampaignStatus = "SCHEDULED" | "DISPATCHING" | "DISPATCHED" | "CANCELLED";

/** A scheduled fleet-wide firmware campaign, as the backend returns it. */
export type FirmwareCampaign = {
  id: string;
  name: string;
  /** The URL the firmware binary lives at (OCPP `UpdateFirmware.location`). */
  targetLocation: string;
  toVersion: string | null;
  /** ISO string: when the station should fetch the firmware. */
  retrieveDateTime: string;
  targetMode: FirmwareCampaignTargetMode;
  targetSiteId: string | null;
  targetChargePointIds: string[];
  /** Advisory only (see api.FirmwareCampaigns.create's JSDoc) — never blocks
   * submission or dispatch. */
  heterogeneousTargetIds: string[];
  /** ISO string: when the campaign starts dispatching. */
  scheduledAt: string;
  /** Delay between each targeted station's dispatch, in milliseconds. */
  staggerMs: number;
  status: FirmwareCampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/** `GET /api/firmware-campaigns/:id`'s detail + progress view, in one call. */
export type FirmwareCampaignProgress = {
  campaign: FirmwareCampaign;
  targetCount: number;
  attemptedCount: number;
  notAttemptedCount: number;
  succeededCount: number;
  failedCount: number;
  inProgressCount: number;
};

/**
 * `targetSiteId` is required (and only meaningful) when
 * `targetMode === "SITE"`; `targetChargePointIds` is required (and only
 * meaningful) when `targetMode === "LIST"`; neither is needed for `"FLEET"`.
 * `scheduledAt`, when given, must be strictly in the future (enforced
 * server-side too, like `SiteVisitSchedule.nextVisitAt`); omitting it
 * dispatches the campaign as soon as possible.
 */
export type CreateFirmwareCampaignBody = {
  name: string;
  targetLocation: string;
  toVersion?: string | null;
  /** ISO string: when the station should fetch the firmware. */
  retrieveDateTime: string;
  targetMode: FirmwareCampaignTargetMode;
  targetSiteId?: string;
  targetChargePointIds?: string[];
  /** ISO string, optional — defaults to "now" server-side. */
  scheduledAt?: string;
  /** Delay between each targeted station's dispatch, in milliseconds. */
  staggerMs?: number;
};

export const firmwareCampaignApis = {
  list: async function (): Promise<FirmwareCampaign[]> {
    return withErrorLogging(
      () => httpClient.get<FirmwareCampaign[]>("/api/firmware-campaigns"),
      "FirmwareCampaigns.list",
    );
  },
  create: async function (body: CreateFirmwareCampaignBody): Promise<FirmwareCampaign> {
    return withErrorLogging(
      () => httpClient.post<FirmwareCampaign>("/api/firmware-campaigns", body),
      "FirmwareCampaigns.create",
    );
  },
  /** `null` for an unknown/out-of-scope id — same non-disclosure pattern as
   * `SiteVisits.getSchedule`, rather than a 404 the caller has to branch on. */
  getProgress: async function (id: string): Promise<FirmwareCampaignProgress | null> {
    return withErrorLogging(
      () => httpClient.get<FirmwareCampaignProgress | null>(`/api/firmware-campaigns/${id}`),
      `FirmwareCampaigns.getProgress(${id})`,
    );
  },
  cancel: async function (id: string): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete(`/api/firmware-campaigns/${id}`),
      `FirmwareCampaigns.cancel(${id})`,
    );
  },
};
