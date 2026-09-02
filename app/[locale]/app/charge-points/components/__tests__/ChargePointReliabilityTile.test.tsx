import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChargePointUptime } from "@/lib/api-uptime";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see SecurityEventsPanel.test.tsx).
const { getChargePointUptime } = vi.hoisted(() => ({ getChargePointUptime: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// SecurityEventsPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { Uptime: { getChargePointUptime } },
}));

import { ChargePointReliabilityTile } from "../ChargePointReliabilityTile";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");
const HOUR_MS = 60 * 60 * 1000;

const buildUptime = (overrides: Partial<ChargePointUptime> = {}): ChargePointUptime => ({
  chargePointId: CP_ID,
  from: new Date(AT.getTime() - 7 * 24 * HOUR_MS).toISOString(),
  to: AT.toISOString(),
  onlineMs: 0,
  totalMs: 0,
  ...overrides,
});

const resolveWith = (uptime: ChargePointUptime) => getChargePointUptime.mockResolvedValue(uptime);

const renderTile = (chargePointId = CP_ID) =>
  render(<ChargePointReliabilityTile chargePointId={chargePointId} />);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChargePointReliabilityTile", () => {
  it("SHOULD render the reduced percentage WHEN the window has elapsed time", async () => {
    resolveWith(buildUptime({ onlineMs: 630_000, totalMs: 700_000 }));

    renderTile();

    expect(await screen.findByText("90.0%")).toBeTruthy();
  });

  it("SHOULD round to one decimal place", async () => {
    resolveWith(buildUptime({ onlineMs: 1, totalMs: 3 }));

    renderTile();

    expect(await screen.findByText("33.3%")).toBeTruthy();
  });

  it("SHOULD show a no-data placeholder rather than dividing by zero WHEN totalMs is 0", async () => {
    resolveWith(buildUptime({ onlineMs: 0, totalMs: 0 }));

    renderTile();

    expect(await screen.findByText("appPage.chargePoints.reliability.noData")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than a blank tile", async () => {
    getChargePointUptime.mockRejectedValue(new Error("boom"));

    renderTile();

    expect(await screen.findByText("common.error")).toBeTruthy();
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    resolveWith(buildUptime());
    const { rerender } = renderTile();
    await waitFor(() => expect(getChargePointUptime).toHaveBeenCalledWith(CP_ID));

    rerender(<ChargePointReliabilityTile chargePointId="cp-2" />);

    await waitFor(() => expect(getChargePointUptime).toHaveBeenCalledWith("cp-2"));
  });
});
