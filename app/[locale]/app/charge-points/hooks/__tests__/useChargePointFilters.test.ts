import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useChargePointFilters } from "../useChargePointFilters";
import { chargePoint } from "./fixtures";

const FLEET = [
  chargePoint("a", { name: "Louvre", ocppVersion: "1.6", meta: { vendor: "Acme" } }),
  chargePoint("b", {
    name: "Bastille",
    ocppVersion: "2.0.1",
    connection: { status: "OFFLINE", lastSeenAt: new Date() },
    meta: { serialNumber: "SN-42" },
  }),
  chargePoint("c", { name: "ocpp-c", ocppIdentity: "ocpp-c", siteId: null }),
];

describe("useChargePointFilters", () => {
  it("SHOULD return the whole fleet WHEN no filter is set", () => {
    const { result } = renderHook(() => useChargePointFilters(FLEET));

    expect(result.current.filteredChargePoints).toHaveLength(3);
  });

  it("SHOULD not filter WHEN the search is shorter than three characters", () => {
    const { result } = renderHook(() => useChargePointFilters(FLEET));

    act(() => result.current.setSearch("lo"));

    expect(result.current.filteredChargePoints).toHaveLength(3);
  });

  it("SHOULD match the name, vendor, model and serial number WHEN searching", () => {
    const { result } = renderHook(() => useChargePointFilters(FLEET));

    act(() => result.current.setSearch("acme"));
    expect(result.current.filteredChargePoints.map((cp) => cp.id)).toEqual(["a"]);

    act(() => result.current.setSearch("sn-42"));
    expect(result.current.filteredChargePoints.map((cp) => cp.id)).toEqual(["b"]);
  });

  it("SHOULD combine the status and OCPP version filters", () => {
    const { result } = renderHook(() => useChargePointFilters(FLEET));

    act(() => result.current.setStatusFilter("OFFLINE"));
    act(() => result.current.setOcppVersionFilter("2.0.1"));
    expect(result.current.filteredChargePoints.map((cp) => cp.id)).toEqual(["b"]);

    act(() => result.current.setOcppVersionFilter("1.6"));
    expect(result.current.filteredChargePoints).toEqual([]);
  });

  it("SHOULD list the OCPP versions present in the fleet, sorted", () => {
    const { result } = renderHook(() => useChargePointFilters(FLEET));

    expect(result.current.ocppVersionOptions).toEqual(["1.6", "2.0.1"]);
  });

  it("SHOULD keep the commissioning backlog on the full list WHEN a filter hides it", () => {
    const { result } = renderHook(() => useChargePointFilters(FLEET));

    act(() => result.current.setStatusFilter("OFFLINE"));

    expect(result.current.awaitingCommissioning.map((cp) => cp.id)).toEqual(["c"]);
  });
});
