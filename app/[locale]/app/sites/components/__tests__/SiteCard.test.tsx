import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

import { SiteCard } from "../SiteCard";

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
    render(<SiteCard site={site} chargePoints={[]} onSiteClicked={vi.fn()} />);

    expect(screen.getByText("Paris Nord")).toBeTruthy();
    expect(screen.getByText("LVMH")).toBeTruthy();
  });

  it("SHOULD split charge points into online/offline counts", () => {
    render(
      <SiteCard
        site={site}
        chargePoints={[chargePoint("1", "SYNCED"), chargePoint("2", "OFFLINE")]}
        onSiteClicked={vi.fn()}
      />,
    );

    expect(screen.getByText("appPage.sites.page.card.online(count=1)")).toBeTruthy();
    expect(screen.getByText("appPage.sites.page.card.offline(count=1)")).toBeTruthy();
  });

  it("SHOULD not show an online/offline breakdown WHEN there are no charge points", () => {
    render(<SiteCard site={site} chargePoints={[]} onSiteClicked={vi.fn()} />);

    expect(screen.queryByText(/online/)).toBeNull();
    expect(screen.queryByText(/offline/)).toBeNull();
  });

  it("SHOULD show a dash for the last visit WHEN the site has never been visited", () => {
    render(<SiteCard site={site} chargePoints={[]} onSiteClicked={vi.fn()} />);

    expect(screen.getByText(`appPage.sites.page.table.columns.lastVisit: —`)).toBeTruthy();
  });

  it("SHOULD call onSiteClicked with the site WHEN the card is clicked", () => {
    const onSiteClicked = vi.fn();
    render(<SiteCard site={site} chargePoints={[]} onSiteClicked={onSiteClicked} />);

    const cardButton = screen.getByRole("button");
    fireEvent.click(cardButton);

    expect(onSiteClicked).toHaveBeenCalledWith(site);
  });
});
