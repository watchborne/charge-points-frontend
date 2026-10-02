import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FleetReliability, FleetReliabilityEntry } from "@/lib/api-fleet-reliability";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/en/app/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: () => "/en/app/dashboard",
    useRouter: () => ({ push }),
    getPathname: vi.fn(),
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: vi.fn(),
  redirect: vi.fn(),
  usePathname: () => "/en/app/dashboard",
  useRouter: () => ({ push }),
  getPathname: vi.fn(),
}));

const { useFleetReliability } = vi.hoisted(() => ({ useFleetReliability: vi.fn() }));
vi.mock("../../../hooks/useFleetReliability", () => ({ useFleetReliability }));

import { FleetReliabilityPanel } from "../FleetReliabilityPanel";

const entry = (overrides: Partial<FleetReliabilityEntry> = {}): FleetReliabilityEntry => ({
  chargePointId: "cp-1",
  name: "CP-1",
  siteId: "site-1",
  onlineMs: 1000,
  totalMs: 1000,
  previousOnlineMs: 1000,
  previousTotalMs: 1000,
  incidentCount: 0,
  previousIncidentCount: 0,
  ...overrides,
});

const reliability = (chargePoints: FleetReliabilityEntry[] = []): FleetReliability => ({
  from: "2026-08-01T00:00:00.000Z",
  to: "2026-08-31T00:00:00.000Z",
  previousFrom: "2026-07-02T00:00:00.000Z",
  previousTo: "2026-08-01T00:00:00.000Z",
  chargePoints,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FleetReliabilityPanel", () => {
  it("SHOULD render one row per charge point, worst first as the backend already ordered them", () => {
    useFleetReliability.mockReturnValue({
      reliability: reliability([
        entry({ chargePointId: "cp-1", name: "Worst station", onlineMs: 100, totalMs: 1000 }),
        entry({ chargePointId: "cp-2", name: "Best station", onlineMs: 1000, totalMs: 1000 }),
      ]),
      loading: false,
      failed: false,
    });

    render(<FleetReliabilityPanel />);

    const rows = screen.getAllByRole("row");
    // header row + 2 data rows, in the order the backend returned them
    expect(rows).toHaveLength(3);
    expect(rows[1].textContent).toContain("Worst station");
    expect(rows[1].textContent).toContain("10.0%");
    expect(rows[2].textContent).toContain("Best station");
    expect(rows[2].textContent).toContain("100.0%");
  });

  it("SHOULD show the incident count for each entry", () => {
    useFleetReliability.mockReturnValue({
      reliability: reliability([entry({ incidentCount: 5 })]),
      loading: false,
      failed: false,
    });

    render(<FleetReliabilityPanel />);

    expect(screen.getByRole("row", { name: /CP-1/ }).textContent).toContain("5");
  });

  it("SHOULD navigate to the charge point WHEN a row is clicked", async () => {
    useFleetReliability.mockReturnValue({
      reliability: reliability([entry({ chargePointId: "cp-42" })]),
      loading: false,
      failed: false,
    });

    render(<FleetReliabilityPanel />);
    screen.getByText("CP-1").closest("tr")?.click();

    expect(push).toHaveBeenCalledWith("/app/charge-points?id=cp-42");
  });

  it("SHOULD render an empty message WHEN there are no charge points", () => {
    useFleetReliability.mockReturnValue({
      reliability: reliability([]),
      loading: false,
      failed: false,
    });

    render(<FleetReliabilityPanel />);

    expect(screen.getByText("appPage.dashboard.fleetReliability.empty")).toBeTruthy();
    expect(screen.queryAllByRole("row")).toHaveLength(0);
  });

  it("SHOULD render an error message WHEN the fetch failed", () => {
    useFleetReliability.mockReturnValue({ reliability: null, loading: false, failed: true });

    render(<FleetReliabilityPanel />);

    expect(screen.getByText("appPage.dashboard.fleetReliability.error")).toBeTruthy();
  });

  it("SHOULD render the skeleton WHILE loading, not the empty message", () => {
    useFleetReliability.mockReturnValue({ reliability: null, loading: true, failed: false });

    render(<FleetReliabilityPanel />);

    expect(screen.queryByText("appPage.dashboard.fleetReliability.empty")).toBeNull();
  });
});
