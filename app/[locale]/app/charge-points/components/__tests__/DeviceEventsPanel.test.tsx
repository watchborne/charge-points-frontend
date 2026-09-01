import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DeviceEventEntry, DeviceEventReport } from "@/lib/api-device-events";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see SecurityEventsPanel.test.tsx).
const { list } = vi.hoisted(() => ({ list: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// SecurityEventsPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { DeviceEvents: { list } },
}));

import { DeviceEventsPanel } from "../DeviceEventsPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildEntry = (overrides: Partial<DeviceEventEntry> = {}): DeviceEventEntry => ({
  eventId: 1,
  timestamp: AT.toISOString(),
  trigger: "Alerting",
  actualValue: "Faulted",
  eventNotificationType: "HardWiredNotification",
  component: { name: "Connector" },
  variable: { name: "AvailabilityState" },
  ...overrides,
});

const buildReport = (
  overrides: Partial<DeviceEventReport> = {},
  events: DeviceEventEntry[] = [buildEntry()],
): DeviceEventReport => ({
  id: "evt-1",
  chargePointId: CP_ID,
  requestId: 1,
  generatedAt: AT.toISOString(),
  seqNo: 1,
  tbc: false,
  events,
  createdAt: AT.toISOString(),
  ...overrides,
});

const resolveWith = (reports: DeviceEventReport[]) => list.mockResolvedValue(reports);

const renderPanel = (chargePointId = CP_ID) =>
  render(<DeviceEventsPanel chargePointId={chargePointId} />);

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith([]);
});

describe("DeviceEventsPanel", () => {
  it("SHOULD say there are no events WHEN the history is empty", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.deviceEvents.empty")).toBeTruthy();
  });

  it("SHOULD render one row per flattened event entry", async () => {
    resolveWith([buildReport()]);

    renderPanel();

    expect(await screen.findByText("Connector · AvailabilityState")).toBeTruthy();
  });

  it("SHOULD flatten every entry across a multi-event frame", async () => {
    resolveWith([
      buildReport({}, [
        buildEntry({ eventId: 1, component: { name: "Connector" }, variable: { name: "A" } }),
        buildEntry({ eventId: 2, component: { name: "EVSE" }, variable: { name: "B" } }),
      ]),
    ]);

    renderPanel();

    expect(await screen.findByText("Connector · A")).toBeTruthy();
    expect(screen.getByText("EVSE · B")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    list.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.deviceEvents.loadError")).toBeTruthy();
  });

  it("SHOULD cap the fetch to the panel's visible report count", async () => {
    renderPanel();

    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));

    rerender(<DeviceEventsPanel chargePointId="cp-2" />);

    await waitFor(() => expect(list).toHaveBeenCalledWith("cp-2", 5));
  });
});
