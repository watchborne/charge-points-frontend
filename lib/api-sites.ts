import { Site, SiteHealth, SiteWithChargePoints } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

type CreateSiteBody = Omit<Site, "id" | "customerId" | "createdAt" | "updatedAt" | "deletedAt"> & {
  customerId?: Site["customerId"];
};

type PatchSiteBody = {
  id: string;
} & Partial<CreateSiteBody>;

export const siteApis = {
  getSites: async function (): Promise<SiteWithChargePoints[]> {
    return withErrorLogging(
      () => httpClient.get<SiteWithChargePoints[]>("/api/sites"),
      "Sites.getSites",
    );
  },
  getSite: async function (siteId: Site["id"]): Promise<SiteWithChargePoints | undefined> {
    return withErrorLogging(
      () => httpClient.get<SiteWithChargePoints | undefined>(`/api/sites/${siteId}`),
      `Sites.getSite(${siteId})`,
    );
  },
  createSite: async function (body: CreateSiteBody): Promise<Site> {
    return withErrorLogging(() => httpClient.post<Site>("/api/sites", body), "Sites.createSite");
  },
  updateSite: async function (siteId: Site["id"], patchBody: PatchSiteBody): Promise<Site> {
    return withErrorLogging(
      () => httpClient.patch<Site>(`/api/sites/${siteId}`, patchBody),
      `Sites.updateSite(${siteId})`,
    );
  },
  deleteSite: async function (siteId: Site["id"]): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete(`/api/sites/${siteId}`),
      `Sites.deleteSite(${siteId})`,
    );
  },
  /** The health of every site visible to the caller (`GET /api/sites/health`). */
  getSitesHealth: async function (): Promise<SiteHealth[]> {
    return withErrorLogging(
      () => httpClient.get<SiteHealth[]>("/api/sites/health"),
      "Sites.getSitesHealth",
    );
  },
};
