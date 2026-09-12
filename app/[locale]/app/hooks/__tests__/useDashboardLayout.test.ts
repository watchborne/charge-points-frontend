import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useDashboardLayout } from "../useDashboardLayout";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("useDashboardLayout", () => {
  it("SHOULD start from the default layout WHEN nothing is stored", () => {
    const { result } = renderHook(() => useDashboardLayout());

    expect(result.current.layout.map((entry) => entry.id)).toEqual([
      "siteHealth",
      "chargePointsBreakdown",
      "fleetOverview",
    ]);
    expect(result.current.layout.every((entry) => entry.visible)).toBe(true);
  });

  it("SHOULD flip a widget's visibility WHEN toggleVisibility is called", () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => result.current.toggleVisibility("siteHealth"));

    expect(result.current.layout.find((entry) => entry.id === "siteHealth")?.visible).toBe(false);
  });

  it("SHOULD swap a widget with its neighbor WHEN moveWidget is called", () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => result.current.moveWidget("chargePointsBreakdown", "up"));

    expect(result.current.layout.map((entry) => entry.id)).toEqual([
      "chargePointsBreakdown",
      "siteHealth",
      "fleetOverview",
    ]);
  });

  it("SHOULD do nothing WHEN moveWidget would push the first widget further up", () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => result.current.moveWidget("siteHealth", "up"));

    expect(result.current.layout.map((entry) => entry.id)).toEqual([
      "siteHealth",
      "chargePointsBreakdown",
      "fleetOverview",
    ]);
  });

  it("SHOULD restore the default layout WHEN resetLayout is called", () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => result.current.toggleVisibility("siteHealth"));
    act(() => result.current.moveWidget("fleetOverview", "up"));
    act(() => result.current.resetLayout());

    expect(result.current.layout).toEqual([
      { id: "siteHealth", visible: true },
      { id: "chargePointsBreakdown", visible: true },
      { id: "fleetOverview", visible: true },
    ]);
  });

  it("SHOULD persist changes across hook instances WHEN re-mounted", () => {
    const { result, unmount } = renderHook(() => useDashboardLayout());

    act(() => result.current.toggleVisibility("fleetOverview"));
    unmount();

    const { result: reloaded } = renderHook(() => useDashboardLayout());

    expect(reloaded.current.layout.find((entry) => entry.id === "fleetOverview")?.visible).toBe(
      false,
    );
  });
});
