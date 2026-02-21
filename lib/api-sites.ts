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
      console.error("Failed to fetch sites:", error);
      throw error;
    }
  },
};
