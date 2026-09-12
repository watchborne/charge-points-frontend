import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DASHBOARD_WIDGET_IDS,
  defaultDashboardLayout,
  readDashboardLayout,
  writeDashboardLayout,
} from "../dashboard-layout";

const STORAGE_KEY = "dashboard-layout";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("dashboard-layout", () => {
  it("SHOULD list every known widget id, all visible, WHEN building the default layout", () => {
    expect(defaultDashboardLayout()).toEqual(
      DASHBOARD_WIDGET_IDS.map((id) => ({ id, visible: true })),
    );
  });

  it("SHOULD return the default layout WHEN nothing is stored", () => {
    expect(readDashboardLayout()).toEqual(defaultDashboardLayout());
  });

  it("SHOULD round-trip a written layout", () => {
    const layout = [
      { id: "fleetOverview" as const, visible: false },
      { id: "siteHealth" as const, visible: true },
      { id: "chargePointsBreakdown" as const, visible: true },
    ];

    writeDashboardLayout(layout);

    expect(readDashboardLayout()).toEqual(layout);
  });

  it("SHOULD fall back to the default layout WHEN the stored value is malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not json");

    expect(readDashboardLayout()).toEqual(defaultDashboardLayout());
  });

  it("SHOULD drop unknown widget ids and append missing ones WHEN reconciling stored preferences", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: "siteHealth", visible: false },
        { id: "retiredWidget", visible: true },
      ]),
    );

    expect(readDashboardLayout()).toEqual([
      { id: "siteHealth", visible: false },
      { id: "chargePointsBreakdown", visible: true },
      { id: "fleetOverview", visible: true },
    ]);
  });
});
