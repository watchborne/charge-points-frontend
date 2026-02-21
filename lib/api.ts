import { ChargePoint } from "@/types/charge-point";
import { Site } from "@/types/site";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = {
  async getChargePoints(): Promise<ChargePoint[]> {
    try {
      const response = await fetch(`${API_URL}/api/charge-points`, {
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
      console.error("Failed to fetch charge points:", error);
      throw error;
    }
  },
  async getSites(): Promise<Site[]> {
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
