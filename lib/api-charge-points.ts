import type {
  ChargePoint,
  ChargePointWithConnectors,
  ChargePointWithSite,
} from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

type CreateChargePointBody = Pick<ChargePoint, "name" | "siteId" | "meta" | "isActive">;

type PatchChargePointBody = Partial<CreateChargePointBody>;

export const chargePointApis = {
  getChargePoints: async function (): Promise<ChargePointWithConnectors[]> {
    try {
      return await httpClient.get<ChargePointWithConnectors[]>("/api/charge-points");
    } catch (error) {
      console.error("Failed to fetch charge points", error);
      throw error;
    }
  },
  getChargePoint: async function (
    ChargePointId: ChargePoint["id"],
  ): Promise<ChargePointWithSite | undefined> {
    try {
      return await httpClient.get<ChargePointWithSite | undefined>(
        `/api/charge-points/${ChargePointId}`,
      );
    } catch (error) {
      console.error(`Failed to fetch charge point ${ChargePointId}`, error);
      throw error;
    }
  },
  createChargePoint: async function (
    body: CreateChargePointBody,
  ): Promise<ChargePointWithConnectors> {
    try {
      return await httpClient.post<ChargePointWithConnectors>("/api/charge-points", body);
    } catch (error) {
      console.error("Failed to create charge point", error, body);
      throw error;
    }
  },
  updateChargePoint: async function (
    chargePointId: ChargePoint["id"],
    patchBody: PatchChargePointBody,
  ): Promise<ChargePointWithConnectors> {
    try {
      return await httpClient.patch<ChargePointWithConnectors>(
        `/api/charge-points/${chargePointId}`,
        patchBody,
      );
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
