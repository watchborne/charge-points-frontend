import { Site } from "@watchborne/charge-points-types";
import { API_URL } from "./api";
import { get, post, patch as httpPatch, del } from "./http-client";

type CreateSiteBody = Omit<Site, "id">;

type PatchSiteBody = {
  id: string;
} & Partial<CreateSiteBody>;

export const siteApis = {
  getSites: async function (): Promise<Site[]> {
    try {
      return await get<Site[]>(`${API_URL}/api/sites`);
    } catch (error) {
      console.error(`Failed to fetch sites`, error);
      throw error;
    }
  },
  getSite: async function (siteId: Site["id"]): Promise<Site | undefined> {
    try {
      return await get<Site | undefined>(`${API_URL}/api/sites/${siteId}`);
    } catch (error) {
      console.error(`Failed to fetch site ${siteId}`, error);
      throw error;
    }
  },
  createSite: async function (body: CreateSiteBody): Promise<Site> {
    try {
      return await post<Site>(`${API_URL}/api/sites`, body);
    } catch (error) {
      console.error("Failed to create site", error, body);
      throw error;
    }
  },
  updateSite: async function (
    siteId: Site["id"],
    patchBody: PatchSiteBody,
  ): Promise<Site> {
    try {
      return await httpPatch<Site>(`${API_URL}/api/sites/${siteId}`, patchBody);
    } catch (error) {
      console.error(`Failed to update site ${siteId}`, error, patchBody);
      throw error;
    }
  },
  deleteSite: async function (siteId: Site["id"]): Promise<void> {
    try {
      await del(`${API_URL}/api/sites/${siteId}`);
    } catch (error) {
      console.error(`Failed to delete site ${siteId}`, error, { siteId });
      throw error;
    }
  },
};
