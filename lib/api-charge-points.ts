import { ChargePoint } from "@/types/charge-point";
import { API_URL } from "./api";

export const chargePointApis = {
  getChargePoints: async function (): Promise<ChargePoint[]> {
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
};
