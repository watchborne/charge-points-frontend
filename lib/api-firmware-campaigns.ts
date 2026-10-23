import type {
  FirmwareCampaign as SharedFirmwareCampaign,
  FirmwareCampaignProgress as SharedFirmwareCampaignProgress,
  FirmwareCampaignStatus,
  FirmwareCampaignTargetMode,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// The shared `FirmwareCampaign` entity and progress view, seen through `Wire`.

export type { FirmwareCampaignStatus, FirmwareCampaignTargetMode };

/** A scheduled fleet-wide firmware campaign, as `POST`/`GET /api/firmware-campaigns` return it. */
export type FirmwareCampaign = Wire<SharedFirmwareCampaign>;

/** `GET /api/firmware-campaigns/:id`'s detail + progress view, in one call. */
export type FirmwareCampaignProgress = Wire<SharedFirmwareCampaignProgress>;

/**
 * `targetSiteId` is required only for `"SITE"`, `targetChargePointIds` only
 * for `"LIST"`. `scheduledAt` must be in the future (checked server-side too);
 * omitted, the campaign dispatches as soon as possible.
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
  /** `null` for an unknown or out-of-scope id. */
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
