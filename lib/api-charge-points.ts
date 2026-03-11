import { ChargePoint } from "@/types/charge-point";
import { API_URL } from "./api";

type CreateChargePointBody = Pick<
  ChargePoint,
  "name" | "siteId" | "meta" | "isActive"
>;

type PatchChargePointBody = Partial<CreateChargePointBody>;

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
      console.error("Failed to fetch charge points", error);
      throw error;
    }
  },
  getChargePoint: async function (
    ChargePointId: ChargePoint["uuid"],
  ): Promise<ChargePoint | undefined> {
    try {
      const response = await fetch(
        `${API_URL}/api/charge-points/${ChargePointId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ChargePoint | undefined;
      return data;
    } catch (error) {
      console.error(`Failed to fetch charge point ${ChargePointId}`, error);
      throw error;
    }
  },
  createChargePoint: async function (
    body: CreateChargePointBody,
  ): Promise<ChargePoint> {
    try {
      const response = await fetch(`${API_URL}/api/charge-points`, {
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
      console.error("Failed to create charge point", error, body);
      throw error;
    }
  },
  updateChargePoint: async function (
    chargePointId: ChargePoint["uuid"],
    patch: PatchChargePointBody,
  ): Promise<ChargePoint> {
    try {
      const response = await fetch(
        `${API_URL}/api/charge-points/${chargePointId}`,
        {
          method: "PATCH",
          body: JSON.stringify(patch),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `Failed to update charge point ${chargePointId}`,
        error,
        patch,
      );
      throw error;
    }
  },
  deleteChargePoint: async function (
    chargePointId: ChargePoint["uuid"],
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/api/charge-points/${chargePointId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to delete charge point ${chargePointId}`, error);
      throw error;
    }
  },
};
