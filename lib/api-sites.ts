import { Site } from "@/types/site";
import { API_URL } from "./api";

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
  createSite: async function ({ body }: { body: Site }): Promise<Site> {
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
    patch: Partial<Site>,
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
      console.error(`Failed to delete site ${siteId}`, error, { siteId });
      throw error;
    }
  },
};
