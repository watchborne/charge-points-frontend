import type { ChargePoint, ChargePointLog } from "@watchborne/charge-points-types";
import { API_URL } from "./api";
import { httpClient } from "./http-client";

type CreateChargePointBody = Pick<ChargePoint, "name" | "siteId" | "meta" | "isActive">;

type PatchChargePointBody = Partial<CreateChargePointBody>;

export const chargePointApis = {
  getChargePoints: async function (): Promise<ChargePoint[]> {
    try {
      return await httpClient.get<ChargePoint[]>(`${API_URL}/api/charge-points`);
    } catch (error) {
      console.error("Failed to fetch charge points", error);
      throw error;
    }
  },
  getChargePoint: async function (
    ChargePointId: ChargePoint["uuid"],
  ): Promise<ChargePoint | undefined> {
    try {
      return await httpClient.get<ChargePoint | undefined>(
        `${API_URL}/api/charge-points/${ChargePointId}`,
      );
    } catch (error) {
      console.error(`Failed to fetch charge point ${ChargePointId}`, error);
      throw error;
    }
  },
  createChargePoint: async function (body: CreateChargePointBody): Promise<ChargePoint> {
    try {
      return await httpClient.post<ChargePoint>(`${API_URL}/api/charge-points`, body);
    } catch (error) {
      console.error("Failed to create charge point", error, body);
      throw error;
    }
  },
  updateChargePoint: async function (
    chargePointId: ChargePoint["uuid"],
    patchBody: PatchChargePointBody,
  ): Promise<ChargePoint> {
    try {
      return await httpClient.patch<ChargePoint>(
        `${API_URL}/api/charge-points/${chargePointId}`,
        patchBody,
      );
    } catch (error) {
      console.error(`Failed to update charge point ${chargePointId}`, error, patchBody);
      throw error;
    }
  },
  getChargePointLogs: async function (
    chargePointId: ChargePoint["uuid"],
  ): Promise<ChargePointLog[]> {
    try {
      return await httpClient.get<ChargePointLog[]>(
        `${API_URL}/api/charge-points/${chargePointId}/logs`,
      );
    } catch (error) {
      console.error(`Failed to fetch logs for charge point ${chargePointId}`, error);
      throw error;
    }
  },
  deleteChargePoint: async function (chargePointId: ChargePoint["uuid"]): Promise<void> {
    try {
      await httpClient.delete(`${API_URL}/api/charge-points/${chargePointId}`);
    } catch (error) {
      console.error(`Failed to delete charge point ${chargePointId}`, error);
      throw error;
    }
  },
};
