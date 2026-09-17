import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mocked via the relative module path, not the "@/lib/api" alias — see
// useStatusHistory.test.ts's identical note: this project's Vitest config
// does not alias "@/" for the mock resolver, so an aliased target here would
// silently mock a different module than the one useBulkChargePointActions
// imports.
vi.mock("../../../../../../lib/api", () => ({
  api: {
    ChargePoints: {
      resetChargePoint: vi.fn(),
      changeAvailability: vi.fn(),
      unlockConnector: vi.fn(),
    },
  },
}));

import { api } from "../../../../../../lib/api";
import type { ChargePointWithConnectors } from "../../../../../../types/charge-point";
import { useBulkChargePointActions } from "../useBulkChargePointActions";

afterEach(() => vi.clearAllMocks());

const chargePoint = (
  id: string,
  overrides: Partial<ChargePointWithConnectors> = {},
): ChargePointWithConnectors =>
  ({
    id,
    name: `CP-${id}`,
    siteId: null,
    isActive: true,
    connection: { status: "SYNCED", lastSeenAt: new Date() },
    ocppVersion: "1.6",
    meta: {},
    connectors: [{ id: `${id}-connector-1`, connectorId: 1, status: "Available" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as ChargePointWithConnectors;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("useBulkChargePointActions", () => {
  it("SHOULD call resetChargePoint for every selected charge point WHEN bulkReset runs", async () => {
    vi.mocked(api.ChargePoints.resetChargePoint).mockResolvedValue({
      ok: true,
      status: "Accepted",
    });
    const { result } = renderHook(() => useBulkChargePointActions(), { wrapper });
    const chargePoints = [chargePoint("cp-1"), chargePoint("cp-2")];

    await act(() => result.current.bulkReset(chargePoints, "Soft"));

    expect(api.ChargePoints.resetChargePoint).toHaveBeenCalledWith("cp-1", "Soft");
    expect(api.ChargePoints.resetChargePoint).toHaveBeenCalledWith("cp-2", "Soft");
  });

  it("SHOULD report each station's own outcome WHEN one succeeds and another fails", async () => {
    vi.mocked(api.ChargePoints.resetChargePoint)
      .mockResolvedValueOnce({ ok: true, status: "Accepted" })
      .mockResolvedValueOnce({ ok: false, httpStatus: 409 });
    const { result } = renderHook(() => useBulkChargePointActions(), { wrapper });
    const chargePoints = [chargePoint("cp-1"), chargePoint("cp-2")];

    let results;
    await act(async () => {
      results = await result.current.bulkReset(chargePoints, "Hard");
    });

    expect(results).toEqual([
      {
        chargePointId: "cp-1",
        chargePointName: "CP-cp-1",
        outcome: { ok: true, status: "Accepted" },
      },
      {
        chargePointId: "cp-2",
        chargePointName: "CP-cp-2",
        outcome: { ok: false, httpStatus: 409 },
      },
    ]);
  });

  it("SHOULD target connectorId 0 (the whole charge point) WHEN bulkChangeAvailability runs", async () => {
    vi.mocked(api.ChargePoints.changeAvailability).mockResolvedValue({
      ok: true,
      status: "Accepted",
    });
    const { result } = renderHook(() => useBulkChargePointActions(), { wrapper });

    await act(() => result.current.bulkChangeAvailability([chargePoint("cp-1")], "Inoperative"));

    expect(api.ChargePoints.changeAvailability).toHaveBeenCalledWith("cp-1", 0, "Inoperative");
  });

  it("SHOULD unlock each station's first connector WHEN bulkUnlockConnector runs", async () => {
    vi.mocked(api.ChargePoints.unlockConnector).mockResolvedValue({ ok: true, status: "Unlocked" });
    const { result } = renderHook(() => useBulkChargePointActions(), { wrapper });
    const cp = chargePoint("cp-1", {
      connectors: [
        { id: "cp-1-connector-2", connectorId: 2, status: "Available" },
      ] as ChargePointWithConnectors["connectors"],
    });

    await act(() => result.current.bulkUnlockConnector([cp]));

    expect(api.ChargePoints.unlockConnector).toHaveBeenCalledWith("cp-1", 2);
  });

  it("SHOULD report a noConnector reason WHEN a selected charge point has no connectors", async () => {
    const { result } = renderHook(() => useBulkChargePointActions(), { wrapper });
    const cp = chargePoint("cp-1", { connectors: [] });

    let results;
    await act(async () => {
      results = await result.current.bulkUnlockConnector([cp]);
    });

    expect(results).toEqual([
      {
        chargePointId: "cp-1",
        chargePointName: "CP-cp-1",
        outcome: { ok: false, reason: "noConnector" },
      },
    ]);
    expect(api.ChargePoints.unlockConnector).not.toHaveBeenCalled();
  });
});
