import type { ChargePoint } from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

type CreateChargePointBody = Pick<ChargePoint, "name" | "siteId" | "meta" | "isActive">;

type PatchChargePointBody = Partial<CreateChargePointBody>;

export const chargePointApis = {
  getChargePoints: async function (): Promise<ChargePoint[]> {
    try {
      return await httpClient.get<ChargePoint[]>("/api/charge-points");
    } catch (error) {
      console.error("Failed to fetch charge points", error);
      throw error;
    }
  },
  getChargePoint: async function (
    ChargePointId: ChargePoint["id"],
  ): Promise<ChargePoint | undefined> {
    try {
      return await httpClient.get<ChargePoint | undefined>(`/api/charge-points/${ChargePointId}`);
    } catch (error) {
      console.error(`Failed to fetch charge point ${ChargePointId}`, error);
      throw error;
    }
  },
  createChargePoint: async function (body: CreateChargePointBody): Promise<ChargePoint> {
    try {
      return await httpClient.post<ChargePoint>("/api/charge-points", body);
    } catch (error) {
      console.error("Failed to create charge point", error, body);
      throw error;
    }
  },
  updateChargePoint: async function (
    chargePointId: ChargePoint["id"],
    patchBody: PatchChargePointBody,
  ): Promise<ChargePoint> {
    try {
      return await httpClient.patch<ChargePoint>(`/api/charge-points/${chargePointId}`, patchBody);
    } catch (error) {
      console.error(`Failed to update charge point ${chargePointId}`, error, patchBody);
      throw error;
    }
  },
  deleteChargePoint: async function (chargePointId: ChargePoint["id"]): Promise<void> {
    try {
      await httpClient.delete(`/api/charge-points/${chargePointId}`);
    } catch (error) {
      console.error(`Failed to delete charge point ${chargePointId}`, error);
      throw error;
    }
  },
};
