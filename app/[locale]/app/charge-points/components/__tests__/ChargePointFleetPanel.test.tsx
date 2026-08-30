import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// The detail panel is a large, independently-testable component with its own
// electrons/date-fns dependencies — mocked here so this suite stays focused
// on the fleet panel's own grouping/selection/tab behavior.
vi.mock("../ChargePointDetailPanel", () => ({
  ChargePointDetailPanel: ({ chargePoint }: { chargePoint: { name: string } }) => (
    <div data-testid="detail-panel">{chargePoint.name}</div>
  ),
}));

import { ChargePointFleetPanel } from "../ChargePointFleetPanel";

// useFlipReorder reads prefers-reduced-motion via matchMedia, which jsdom
// doesn't implement.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => cleanup());

const site = (id: string, name: string): Site =>
  ({
    id,
    name,
    customer: "LVMH",
    customerId: "c-1",
    installedAt: new Date(),
    lastVisitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as Site;

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
    connectors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as ChargePointWithConnectors;

const noop = () => {};

const baseProps = {
  onSelect: vi.fn(),
  onEditClicked: noop,
  onDeleteClicked: noop,
};

describe("ChargePointFleetPanel", () => {
  it("SHOULD show the empty state WHEN there are no charge points", () => {
    render(<ChargePointFleetPanel {...baseProps} sites={[]} chargePoints={[]} selected={null} />);

    expect(screen.getByText("appPage.chargePoints.page.empty.noChargePointFound")).toBeTruthy();
  });

  it("SHOULD group charge points by site WHEN grouping by site", () => {
    const sites = [site("site-1", "Paris")];
    const chargePoints = [chargePoint("cp-1", { siteId: "site-1" }), chargePoint("cp-2")];

    render(
      <ChargePointFleetPanel
        {...baseProps}
        sites={sites}
        chargePoints={chargePoints}
        selected={null}
      />,
    );

    // "Paris" legitimately renders twice: as the group label and again as the
    // card's site Tag.
    expect(screen.getAllByText("Paris").length).toBeGreaterThan(0);
    expect(screen.getAllByText("appPage.chargePoints.detail.unknownSite").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("CP-cp-1")).toBeTruthy();
    expect(screen.getByText("CP-cp-2")).toBeTruthy();
  });

  it("SHOULD group charge points by vendor WHEN switching the tab to vendor", () => {
    const chargePoints = [
      chargePoint("cp-1", { meta: { vendor: "Schneider" } }),
      chargePoint("cp-2", { meta: { vendor: "ABB" } }),
    ];

    render(
      <ChargePointFleetPanel
        {...baseProps}
        sites={[]}
        chargePoints={chargePoints}
        selected={null}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "appPage.chargePoints.page.groupBy.vendor" }));

    // Each vendor name legitimately renders twice: as the group label and
    // again as the card's vendor/model subtitle.
    expect(screen.getAllByText("ABB").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Schneider").length).toBeGreaterThan(0);
  });

  it("SHOULD call onSelect with the charge point WHEN an unselected item is clicked", () => {
    const onSelect = vi.fn();
    const chargePoints = [chargePoint("cp-1")];

    render(
      <ChargePointFleetPanel
        {...baseProps}
        onSelect={onSelect}
        sites={[]}
        chargePoints={chargePoints}
        selected={null}
      />,
    );

    fireEvent.click(screen.getByText("CP-cp-1"));

    expect(onSelect).toHaveBeenCalledWith(chargePoints[0]);
  });

  it("SHOULD call onSelect with null WHEN the already-selected item is clicked again", () => {
    const onSelect = vi.fn();
    const cp = chargePoint("cp-1");

    render(
      <ChargePointFleetPanel
        {...baseProps}
        onSelect={onSelect}
        sites={[]}
        chargePoints={[cp]}
        selected={cp}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /CP-cp-1/ }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("SHOULD render the detail panel for the selected charge point", () => {
    const cp = chargePoint("cp-1");

    render(<ChargePointFleetPanel {...baseProps} sites={[]} chargePoints={[cp]} selected={cp} />);

    expect(screen.getByTestId("detail-panel")).toHaveProperty("textContent", "CP-cp-1");
  });

  it("SHOULD show the select prompt WHEN nothing is selected", () => {
    render(<ChargePointFleetPanel {...baseProps} sites={[]} chargePoints={[]} selected={null} />);

    expect(screen.getByText("appPage.chargePoints.page.detail.selectPrompt")).toBeTruthy();
  });
});
