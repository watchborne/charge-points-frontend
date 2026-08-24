import { cleanup, render, screen } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values && Object.keys(values).length > 0) {
      const paramList = Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      return `${key}(${paramList})`;
    }
    return key;
  },
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString().slice(0, 10),
  }),
}));

import { SiteGrid } from "../SiteGrid";

afterEach(() => cleanup());

const site = (id: string, name: string): Site =>
  ({
    id,
    name,
    customer: "LVMH",
    customerId: "c-1",
    installedAt: new Date("2024-01-15T00:00:00.000Z"),
    lastVisitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as Site;

const chargePoint = (id: string, siteId: string): ChargePointWithConnectors =>
  ({
    id,
    name: `CP-${id}`,
    siteId,
    isActive: true,
    connection: { status: "SYNCED", lastSeenAt: new Date() },
    ocppVersion: "1.6",
    meta: {},
    connectors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as ChargePointWithConnectors;

describe("SiteGrid", () => {
  it("SHOULD show the empty state WHEN there are no sites", () => {
    render(
      <SiteGrid sites={[]} chargePoints={[]} onEditClicked={vi.fn()} onDeleteClicked={vi.fn()} />,
    );

    expect(screen.getByText("appPage.sites.page.table.empty")).toBeTruthy();
  });

  it("SHOULD render one card per site", () => {
    render(
      <SiteGrid
        sites={[site("s-1", "Paris"), site("s-2", "Lyon")]}
        chargePoints={[]}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.getByText("Paris")).toBeTruthy();
    expect(screen.getByText("Lyon")).toBeTruthy();
  });

  it("SHOULD only pass a site its own charge points, filtered by siteId", () => {
    render(
      <SiteGrid
        sites={[site("s-1", "Paris"), site("s-2", "Lyon")]}
        chargePoints={[chargePoint("cp-1", "s-1"), chargePoint("cp-2", "s-2")]}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(
      screen.getAllByText("appPage.sites.page.card.chargePointsWithCount(count=1)").length,
    ).toBe(2);
  });
});
