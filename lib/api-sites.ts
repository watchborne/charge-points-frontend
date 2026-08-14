import { Site, SiteHealth, SiteWithChargePoints } from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

type CreateSiteBody = Omit<Site, "id" | "customerId" | "createdAt" | "updatedAt" | "deletedAt"> & {
  customerId?: Site["customerId"];
};

type PatchSiteBody = {
  id: string;
} & Partial<CreateSiteBody>;

export const siteApis = {
  getSites: async function (): Promise<SiteWithChargePoints[]> {
    try {
      return await httpClient.get<SiteWithChargePoints[]>("/api/sites");
    } catch (error) {
      console.error(`Failed to fetch sites`, error);
      throw error;
    }
  },
  getSite: async function (siteId: Site["id"]): Promise<SiteWithChargePoints | undefined> {
    try {
      return await httpClient.get<SiteWithChargePoints | undefined>(`/api/sites/${siteId}`);
    } catch (error) {
      console.error(`Failed to fetch site ${siteId}`, error);
      throw error;
    }
  },
  createSite: async function (body: CreateSiteBody): Promise<Site> {
    try {
      return await httpClient.post<Site>("/api/sites", body);
    } catch (error) {
      console.error("Failed to create site", error, body);
      throw error;
    }
  },
  updateSite: async function (siteId: Site["id"], patchBody: PatchSiteBody): Promise<Site> {
    try {
      return await httpClient.patch<Site>(`/api/sites/${siteId}`, patchBody);
    } catch (error) {
      console.error(`Failed to update site ${siteId}`, error, patchBody);
      throw error;
    }
  },
  deleteSite: async function (siteId: Site["id"]): Promise<void> {
    try {
      await httpClient.delete(`/api/sites/${siteId}`);
    } catch (error) {
      console.error(`Failed to delete site ${siteId}`, error, { siteId });
      throw error;
    }
  },
  /** The health of every site visible to the caller (`GET /api/sites/health`). */
  getSitesHealth: async function (): Promise<SiteHealth[]> {
    try {
      return await httpClient.get<SiteHealth[]>("/api/sites/health");
    } catch (error) {
      console.error("Failed to fetch sites health", error);
      throw error;
    }
  },
};
