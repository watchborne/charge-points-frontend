import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "appPage.sites.page.table.columns.actions": "Actions",
      "common.edit": "Edit",
      "common.delete": "Delete",
      "appPage.sites.page.card.chargePointsWithCount": `${values?.count ?? ""} charge points`,
      "appPage.sites.page.card.online": `${values?.count ?? ""} online`,
      "appPage.sites.page.card.offline": `${values?.count ?? ""} offline`,
      "appPage.sites.page.table.columns.installDate": "Installed",
      "appPage.sites.page.table.columns.lastVisit": "Last visit",
    };
    return map[key] ?? key;
  },
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString().slice(0, 10),
  }),
}));

import { SiteCard } from "../SiteCard";

// Radix DropdownMenu opens on pointer events and uses pointer-capture APIs jsdom
// doesn't implement; polyfill them so the menu can open in tests.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

const openMenu = () => {
  const trigger = screen.getByRole("button", { name: "Actions" });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
};

afterEach(() => cleanup());

const site: Site = {
  id: "site-1",
  name: "Paris Nord",
  customer: "LVMH",
  customerId: "c-1",
  installedAt: new Date("2024-01-15T00:00:00.000Z"),
  lastVisitedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as Site;

const chargePoint = (id: string, status: string): ChargePointWithConnectors =>
  ({
    id,
    ocppIdentity: `CP-${id}`,
    name: `CP-${id}`,
    siteId: site.id,
    isActive: true,
    connection: { status, lastSeenAt: new Date() },
    ocppVersion: "1.6",
    meta: {},
    connectors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }) as ChargePointWithConnectors;

describe("SiteCard", () => {
  it("SHOULD render the site name and customer", () => {
    render(
      <SiteCard site={site} chargePoints={[]} onEditClicked={vi.fn()} onDeleteClicked={vi.fn()} />,
    );

    expect(screen.getByText("Paris Nord")).toBeTruthy();
    expect(screen.getByText("LVMH")).toBeTruthy();
  });

  it("SHOULD split charge points into online/offline counts", () => {
    render(
      <SiteCard
        site={site}
        chargePoints={[chargePoint("1", "SYNCED"), chargePoint("2", "OFFLINE")]}
        onEditClicked={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.getByText("1 online")).toBeTruthy();
    expect(screen.getByText("1 offline")).toBeTruthy();
  });

  it("SHOULD not show an online/offline breakdown WHEN there are no charge points", () => {
    render(
      <SiteCard site={site} chargePoints={[]} onEditClicked={vi.fn()} onDeleteClicked={vi.fn()} />,
    );

    expect(screen.queryByText(/online/)).toBeNull();
    expect(screen.queryByText(/offline/)).toBeNull();
  });

  it("SHOULD show a dash for the last visit WHEN the site has never been visited", () => {
    render(
      <SiteCard site={site} chargePoints={[]} onEditClicked={vi.fn()} onDeleteClicked={vi.fn()} />,
    );

    expect(screen.getByText(/Last visit: —/)).toBeTruthy();
  });

  it("SHOULD call onEditClicked with the site WHEN Edit is chosen from the menu", async () => {
    const onEditClicked = vi.fn();
    render(
      <SiteCard
        site={site}
        chargePoints={[]}
        onEditClicked={onEditClicked}
        onDeleteClicked={vi.fn()}
      />,
    );

    openMenu();
    fireEvent.click(await screen.findByText("Edit"));

    expect(onEditClicked).toHaveBeenCalledWith(site);
  });

  it("SHOULD call onDeleteClicked with the site WHEN Delete is chosen from the menu", async () => {
    const onDeleteClicked = vi.fn();
    render(
      <SiteCard
        site={site}
        chargePoints={[]}
        onEditClicked={vi.fn()}
        onDeleteClicked={onDeleteClicked}
      />,
    );

    openMenu();
    fireEvent.click(await screen.findByText("Delete"));

    expect(onDeleteClicked).toHaveBeenCalledWith(site);
  });
});
