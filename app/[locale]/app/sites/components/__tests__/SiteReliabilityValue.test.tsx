import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SiteUptime } from "@/lib/api-uptime";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see SecurityEventsPanel.test.tsx).
const { getSiteUptime } = vi.hoisted(() => ({ getSiteUptime: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// SecurityEventsPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { Uptime: { getSiteUptime } },
}));

import { SiteReliabilityValue } from "../SiteReliabilityValue";

afterEach(() => cleanup());

const SITE_ID = "site-1";
const AT = new Date("2026-08-09T12:00:00Z");
const HOUR_MS = 60 * 60 * 1000;

const buildUptime = (overrides: Partial<SiteUptime> = {}): SiteUptime => ({
  siteId: SITE_ID,
  from: new Date(AT.getTime() - 7 * 24 * HOUR_MS).toISOString(),
  to: AT.toISOString(),
  onlineMs: 0,
  totalMs: 0,
  lastActivity: null,
  chargePoints: [],
  ...overrides,
});

const resolveWith = (uptime: SiteUptime) => getSiteUptime.mockResolvedValue(uptime);

const renderValue = (siteId = SITE_ID) => render(<SiteReliabilityValue siteId={siteId} />);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SiteReliabilityValue", () => {
  it("SHOULD render the summed percentage across the site's charge points", async () => {
    resolveWith(buildUptime({ onlineMs: 630_000, totalMs: 700_000 }));

    renderValue();

    expect(await screen.findByText("90.0%")).toBeTruthy();
  });

  it("SHOULD show a no-data placeholder rather than dividing by zero WHEN totalMs is 0", async () => {
    resolveWith(buildUptime({ onlineMs: 0, totalMs: 0 }));

    renderValue();

    expect(await screen.findByText("appPage.sites.detail.reliability.noData")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than a blank value", async () => {
    getSiteUptime.mockRejectedValue(new Error("boom"));

    renderValue();

    expect(await screen.findByText("common.error")).toBeTruthy();
  });

  it("SHOULD refetch WHEN a different site is opened", async () => {
    resolveWith(buildUptime());
    const { rerender } = renderValue();
    await waitFor(() => expect(getSiteUptime).toHaveBeenCalledWith(SITE_ID));

    rerender(<SiteReliabilityValue siteId="site-2" />);

    await waitFor(() => expect(getSiteUptime).toHaveBeenCalledWith("site-2"));
  });
});
