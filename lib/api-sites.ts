import { Site } from "@/types/site";
import { API_URL } from "./api";

type CreateSiteBody = Omit<Site, "id">;

type PatchSiteBody = {
  id: string;
} & Partial<CreateSiteBody>;

export const siteApis = {
  getSites: async function (): Promise<Site[]> {
    try {
      const response = await fetch(`${API_URL}/api/sites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to fetch sites`, error);
      throw error;
    }
  },
  getSite: async function (siteId: Site["id"]): Promise<Site | undefined> {
    try {
      const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Site | undefined;
      return data;
    } catch (error) {
      console.error(`Failed to fetch site ${siteId}`, error);
      throw error;
    }
  },
  createSite: async function (body: CreateSiteBody): Promise<Site> {
    try {
      const response = await fetch(`${API_URL}/api/sites`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to create site", error, body);
      throw error;
    }
  },
  updateSite: async function (
    siteId: Site["id"],
    patch: PatchSiteBody,
  ): Promise<Site> {
    try {
      const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to update site ${siteId}`, error, patch);
      throw error;
    }
  },
  deleteSite: async function (siteId: Site["id"]): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to delete site ${siteId}`, error, { siteId });
      throw error;
    }
  },
};
