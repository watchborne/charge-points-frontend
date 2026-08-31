import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ChargingSession } from "@watchborne/charge-points-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see LogUploadPanel.test.tsx).
const { listChargingSessions } = vi.hoisted(() => ({
  listChargingSessions: vi.fn(),
}));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// LogUploadPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { listChargingSessions } },
}));

import { ChargingSessionsPanel } from "../ChargingSessionsPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-31T10:00:00Z");

const buildSession = (overrides: Partial<ChargingSession> = {}): ChargingSession =>
  ({
    id: "session-1",
    chargePointId: CP_ID,
    connectorId: 1,
    transactionId: "1",
    idTag: "04A1B2C3",
    meterStart: 1000,
    meterStop: 5000,
    status: "ENDED",
    stoppedReason: "Local",
    startedAt: AT,
    endedAt: new Date("2026-08-31T10:45:00Z"),
    createdAt: AT,
    updatedAt: new Date("2026-08-31T10:45:00Z"),
    ...overrides,
  }) as ChargingSession;

beforeEach(() => {
  vi.clearAllMocks();
  listChargingSessions.mockResolvedValue([]);
});

const renderPanel = () => render(<ChargingSessionsPanel chargePointId={CP_ID} />);

describe("ChargingSessionsPanel", () => {
  it("SHOULD show a loading state WHILE fetching", () => {
    renderPanel();

    expect(screen.getByText("appPage.chargePoints.chargingSessions.loading")).toBeTruthy();
  });

  it("SHOULD say so WHEN the charge point has no charging sessions", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.chargingSessions.empty")).toBeTruthy();
  });

  it("SHOULD render an ENDED session with its energy delivered", async () => {
    listChargingSessions.mockResolvedValue([buildSession()]);

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.chargingSessions.statuses.ENDED"),
    ).toBeTruthy();
    expect(
      screen.getByText("appPage.chargePoints.chargingSessions.stoppedReasons.Local"),
    ).toBeTruthy();
    expect(screen.getByText("4,000 Wh")).toBeTruthy();
  });

  it("SHOULD render an ACTIVE session with no energy figure, since 2.0.1 carries no meterStart/meterStop", async () => {
    listChargingSessions.mockResolvedValue([
      buildSession({
        id: "session-2",
        evseId: 1,
        meterStart: undefined,
        meterStop: undefined,
        status: "ACTIVE",
        stoppedReason: undefined,
        endedAt: null,
      }),
    ]);

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.chargingSessions.statuses.ACTIVE"),
    ).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    listChargingSessions.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.chargingSessions.loadError")).toBeTruthy();
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(listChargingSessions).toHaveBeenCalledWith(CP_ID, 20));

    rerender(<ChargingSessionsPanel chargePointId="cp-2" />);

    await waitFor(() => expect(listChargingSessions).toHaveBeenCalledWith("cp-2", 20));
  });
});
