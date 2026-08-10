import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see TriggerMessageControl.test.tsx).
const { getFirmware, useWebSocketContext } = vi.hoisted(() => ({
  getFirmware: vi.fn(),
  useWebSocketContext: vi.fn(),
}));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// TriggerMessageControl.test.tsx.
vi.mock("../../../../../lib/api", () => ({
  api: { ChargePoints: { getFirmware } },
}));

vi.mock("../../../hooks/useWebSocketContext", () => ({
  useWebSocketContext: () => useWebSocketContext(),
}));

import type { ChargePointFirmware, FirmwareUpdateView } from "@/types/firmware";

import { FirmwarePanel } from "../FirmwarePanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildUpdate = (overrides: Partial<FirmwareUpdateView> = {}): FirmwareUpdateView =>
  ({
    id: "fw-1",
    chargePointId: CP_ID,
    origin: "INSTALLER",
    targetLocation: "https://firmware.example.com/2.4.1.bin",
    retrieveDateTime: AT,
    fromVersion: "2.3.0",
    toVersion: null,
    status: "Downloading",
    steps: [{ status: "Downloading", occurredAt: AT }],
    startedAt: AT,
    finishedAt: null,
    outcome: null,
    failureInfo: null,
    createdAt: AT,
    updatedAt: AT,
    isStalled: false,
    ...overrides,
  }) as FirmwareUpdateView;

const HISTORIZED = buildUpdate({
  id: "fw-0",
  status: "Installed",
  steps: null,
  toVersion: "2.4.1",
  finishedAt: AT,
  outcome: "SUCCEEDED",
});

const resolveWith = (firmware: ChargePointFirmware) => getFirmware.mockResolvedValue(firmware);

beforeEach(() => {
  vi.clearAllMocks();
  useWebSocketContext.mockReturnValue({ lastMessage: null });
  resolveWith({ active: null, lastCompleted: null });
});

// Takes the props object rather than a defaulted positional argument: passing
// `undefined` explicitly would otherwise fall back to the default and never
// exercise the no-version-reported branch.
const renderPanel = (
  { firmwareVersion }: { firmwareVersion?: string } = { firmwareVersion: "2.4.1" },
) =>
  render(
    <FirmwarePanel chargePointId={CP_ID} firmwareVersion={firmwareVersion} ocppVersion="2.0.1" />,
  );

describe("FirmwarePanel", () => {
  it("SHOULD show the version the station reported", async () => {
    renderPanel({ firmwareVersion: "2.4.1" });

    expect(await screen.findByText("v2.4.1")).toBeTruthy();
  });

  it("SHOULD say the version is unknown WHEN the station never reported one", async () => {
    renderPanel({});

    expect(await screen.findByText("appPage.chargePoints.firmware.unknownVersion")).toBeTruthy();
  });

  it("SHOULD say so WHEN the charge point has never been updated", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.firmware.neverUpdated")).toBeTruthy();
  });

  it("SHOULD render the timeline WHEN an update is in flight", async () => {
    resolveWith({ active: buildUpdate(), lastCompleted: null });

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.firmware.inProgress")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("SHOULD flag an externally-triggered update as such", async () => {
    resolveWith({ active: buildUpdate({ origin: "EXTERNAL" }), lastCompleted: null });

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.firmware.origins.EXTERNAL")).toBeTruthy();
  });

  it("SHOULD show the last update with its version transition", async () => {
    resolveWith({ active: null, lastCompleted: HISTORIZED });

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.firmware.lastUpdate")).toBeTruthy();
    expect(screen.getByText(/2\.3\.0 → 2\.4\.1/)).toBeTruthy();
  });

  it("SHOULD surface the station's own failure reason WHEN the last update failed", async () => {
    resolveWith({
      active: null,
      lastCompleted: buildUpdate({
        status: "InvalidSignature",
        steps: null,
        finishedAt: AT,
        outcome: "FAILED",
        failureInfo: "Signature does not match",
      }),
    });

    renderPanel();

    expect(await screen.findByText("Signature does not match")).toBeTruthy();
  });

  it("SHOULD fall back to the terminal status WHEN a failed update carries no detail", async () => {
    resolveWith({
      active: null,
      lastCompleted: buildUpdate({
        status: "DownloadFailed",
        steps: null,
        finishedAt: AT,
        outcome: "FAILED",
        failureInfo: null,
      }),
    });

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.firmware.statuses.DownloadFailed"),
    ).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    getFirmware.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.firmware.loadError")).toBeTruthy();
  });

  it("SHOULD refetch WHEN a firmware broadcast arrives for this charge point", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(getFirmware).toHaveBeenCalledTimes(1));

    useWebSocketContext.mockReturnValue({
      lastMessage: {
        type: "CHARGE_POINT_FIRMWARE_UPDATE",
        payload: { firmwareUpdate: buildUpdate() },
      },
    });
    rerender(<FirmwarePanel chargePointId={CP_ID} firmwareVersion="2.4.1" ocppVersion="2.0.1" />);

    // Refetched rather than patched from the payload: a terminal status moves the
    // update from `active` to `lastCompleted`, which the broadcast alone doesn't say.
    await waitFor(() => expect(getFirmware).toHaveBeenCalledTimes(2));
  });

  it("SHOULD ignore a broadcast about a different charge point", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(getFirmware).toHaveBeenCalledTimes(1));

    useWebSocketContext.mockReturnValue({
      lastMessage: {
        type: "CHARGE_POINT_FIRMWARE_UPDATE",
        payload: { firmwareUpdate: buildUpdate({ chargePointId: "cp-other" }) },
      },
    });
    rerender(<FirmwarePanel chargePointId={CP_ID} firmwareVersion="2.4.1" ocppVersion="2.0.1" />);

    await waitFor(() => expect(getFirmware).toHaveBeenCalledTimes(1));
  });

  it("SHOULD ignore an unrelated WebSocket message", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(getFirmware).toHaveBeenCalledTimes(1));

    useWebSocketContext.mockReturnValue({
      lastMessage: { type: "CHARGE_POINT_MONITORING", payload: {} },
    });
    rerender(<FirmwarePanel chargePointId={CP_ID} firmwareVersion="2.4.1" ocppVersion="2.0.1" />);

    await waitFor(() => expect(getFirmware).toHaveBeenCalledTimes(1));
  });

  it("SHOULD disable the update trigger WHILE an update is in flight", async () => {
    resolveWith({ active: buildUpdate(), lastCompleted: null });

    renderPanel();

    // The backend refuses a second concurrent update; saying so upfront beats
    // letting the installer fill a form that would be rejected.
    const trigger = (
      await screen.findByText("appPage.chargePoints.firmware.update.button")
    ).closest("button");
    expect(trigger?.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD enable the update trigger WHEN nothing is in flight", async () => {
    resolveWith({ active: null, lastCompleted: HISTORIZED });

    renderPanel();

    const trigger = (
      await screen.findByText("appPage.chargePoints.firmware.update.button")
    ).closest("button");
    expect(trigger?.hasAttribute("disabled")).toBe(false);
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(getFirmware).toHaveBeenCalledWith(CP_ID));

    rerender(<FirmwarePanel chargePointId="cp-2" firmwareVersion="1.0.0" ocppVersion="2.0.1" />);

    await waitFor(() => expect(getFirmware).toHaveBeenCalledWith("cp-2"));
  });
});
