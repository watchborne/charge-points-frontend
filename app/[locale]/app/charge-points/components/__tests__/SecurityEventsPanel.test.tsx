import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SecurityEvent } from "@/lib/api-security-events";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see AlertsPanel.test.tsx).
const { list } = vi.hoisted(() => ({ list: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// AlertsPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { SecurityEvents: { list } },
}));

import { SecurityEventsPanel } from "../SecurityEventsPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildEvent = (overrides: Partial<SecurityEvent> = {}): SecurityEvent => ({
  id: "sec-1",
  chargePointId: CP_ID,
  type: "TamperDetectionActivated",
  techInfo: undefined,
  occurredAt: AT.toISOString(),
  createdAt: AT.toISOString(),
  ...overrides,
});

const resolveWith = (events: SecurityEvent[]) => list.mockResolvedValue(events);

const renderPanel = (chargePointId = CP_ID) =>
  render(<SecurityEventsPanel chargePointId={chargePointId} />);

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith([]);
});

describe("SecurityEventsPanel", () => {
  it("SHOULD say there are no events WHEN the history is empty", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.securityEvents.empty")).toBeTruthy();
  });

  it("SHOULD humanize the station's PascalCase event type", async () => {
    resolveWith([buildEvent({ type: "TamperDetectionActivated" })]);

    renderPanel();

    expect(await screen.findByText("Tamper Detection Activated")).toBeTruthy();
  });

  it("SHOULD show techInfo WHEN the station sent it", async () => {
    resolveWith([buildEvent({ techInfo: "Enclosure sensor triggered" })]);

    renderPanel();

    expect(await screen.findByText("Enclosure sensor triggered")).toBeTruthy();
  });

  it("SHOULD NOT show a techInfo line WHEN the station sent none", async () => {
    resolveWith([buildEvent({ techInfo: undefined })]);

    renderPanel();

    await screen.findByText("Tamper Detection Activated");
    expect(screen.queryByText("Enclosure sensor triggered")).toBeNull();
  });

  it("SHOULD render one row per event, newest first as the backend returns them", async () => {
    resolveWith([
      buildEvent({ id: "sec-1", type: "FirmwareUpdated" }),
      buildEvent({ id: "sec-2", type: "StartupOfTheDevice" }),
    ]);

    renderPanel();

    expect(await screen.findByText("Firmware Updated")).toBeTruthy();
    expect(screen.getByText("Startup Of The Device")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    list.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.securityEvents.loadError")).toBeTruthy();
  });

  it("SHOULD cap the fetch to the panel's visible event count", async () => {
    renderPanel();

    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));

    rerender(<SecurityEventsPanel chargePointId="cp-2" />);

    await waitFor(() => expect(list).toHaveBeenCalledWith("cp-2", 5));
  });
});
