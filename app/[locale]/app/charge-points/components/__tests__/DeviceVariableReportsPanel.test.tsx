import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  DeviceVariableReport,
  DeviceVariableReportEntry,
} from "@/lib/api-device-variable-reports";

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
  api: { DeviceVariableReports: { list } },
}));

import { DeviceVariableReportsPanel } from "../DeviceVariableReportsPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildEntry = (
  overrides: Partial<DeviceVariableReportEntry> = {},
): DeviceVariableReportEntry => ({
  component: { name: "ChargingStation" },
  variable: { name: "HeartbeatInterval" },
  attributes: [{ type: "Actual", value: "60" }],
  ...overrides,
});

const buildReport = (
  overrides: Partial<DeviceVariableReport> = {},
  entries: DeviceVariableReportEntry[] = [buildEntry()],
): DeviceVariableReport => ({
  id: "rep-1",
  chargePointId: CP_ID,
  requestId: 1,
  generatedAt: AT.toISOString(),
  seqNo: 1,
  tbc: false,
  entries,
  createdAt: AT.toISOString(),
  ...overrides,
});

const resolveWith = (reports: DeviceVariableReport[]) => list.mockResolvedValue(reports);

const renderPanel = (chargePointId = CP_ID) =>
  render(<DeviceVariableReportsPanel chargePointId={chargePointId} />);

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith([]);
});

describe("DeviceVariableReportsPanel", () => {
  it("SHOULD say there are no reports WHEN the history is empty", async () => {
    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.deviceVariableReports.empty"),
    ).toBeTruthy();
  });

  it("SHOULD render one row per flattened entry with its attributes", async () => {
    resolveWith([buildReport()]);

    renderPanel();

    expect(await screen.findByText("ChargingStation · HeartbeatInterval")).toBeTruthy();
    expect(screen.getByText("Actual: 60")).toBeTruthy();
  });

  it("SHOULD flatten every entry across a multi-variable frame", async () => {
    resolveWith([
      buildReport({}, [
        buildEntry({ component: { name: "A" }, variable: { name: "X" } }),
        buildEntry({ component: { name: "B" }, variable: { name: "Y" } }),
      ]),
    ]);

    renderPanel();

    expect(await screen.findByText("A · X")).toBeTruthy();
    expect(screen.getByText("B · Y")).toBeTruthy();
  });

  it("SHOULD omit attributes with no reported value", async () => {
    resolveWith([buildReport({}, [buildEntry({ attributes: [{ type: "Actual" }] })])]);

    renderPanel();

    await screen.findByText("ChargingStation · HeartbeatInterval");
    expect(screen.queryByText(/Actual:/)).toBeNull();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    list.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.deviceVariableReports.loadError"),
    ).toBeTruthy();
  });

  it("SHOULD cap the fetch to the panel's visible report count", async () => {
    renderPanel();

    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));

    rerender(<DeviceVariableReportsPanel chargePointId="cp-2" />);

    await waitFor(() => expect(list).toHaveBeenCalledWith("cp-2", 5));
  });
});
