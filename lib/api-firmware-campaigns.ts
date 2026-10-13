import type {
  FirmwareCampaign as SharedFirmwareCampaign,
  FirmwareCampaignProgress as SharedFirmwareCampaignProgress,
  FirmwareCampaignStatus,
  FirmwareCampaignTargetMode,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// `FirmwareCampaign`'s response shape: the shared entity and its progress view
// (@watchborne/charge-points-types), as they look once serialized to JSON —
// timestamps arrive as ISO strings and are parsed where rendered (see `Wire`).
// charge-points-server ADR 0017.

export type { FirmwareCampaignStatus, FirmwareCampaignTargetMode };

/** A scheduled fleet-wide firmware campaign, as `POST`/`GET /api/firmware-campaigns` return it. */
export type FirmwareCampaign = Wire<SharedFirmwareCampaign>;

/** `GET /api/firmware-campaigns/:id`'s detail + progress view, in one call. */
export type FirmwareCampaignProgress = Wire<SharedFirmwareCampaignProgress>;

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
