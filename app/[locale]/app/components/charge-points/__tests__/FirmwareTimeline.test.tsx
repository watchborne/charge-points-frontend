import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import type { FirmwareUpdateView } from "@/types/firmware";

import { FirmwareTimeline, derivePhaseStates } from "../FirmwareTimeline";

afterEach(() => cleanup());

const AT = new Date("2026-08-09T12:00:00Z");

const buildUpdate = (overrides: Partial<FirmwareUpdateView> = {}): FirmwareUpdateView =>
  ({
    id: "fw-1",
    chargePointId: "cp-1",
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

const stepsFor = (...statuses: string[]) =>
  statuses.map((status) => ({ status, occurredAt: AT })) as FirmwareUpdateView["steps"];

describe("derivePhaseStates", () => {
  it("SHOULD mark the reported phase active and the rest pending WHEN an update has just started", () => {
    const states = derivePhaseStates(buildUpdate());

    expect(states).toEqual({
      DOWNLOAD: "active",
      SIGNATURE: "pending",
      INSTALL: "pending",
      REBOOT: "pending",
    });
  });

  it("SHOULD mark earlier phases done and the current one active as the update advances", () => {
    const states = derivePhaseStates(
      buildUpdate({
        steps: stepsFor("Downloading", "Downloaded", "SignatureVerified", "Installing"),
        status: "Installing",
      }),
    );

    expect(states).toEqual({
      DOWNLOAD: "done",
      SIGNATURE: "done",
      INSTALL: "active",
      REBOOT: "pending",
    });
  });

  it("SHOULD NOT walk backwards WHEN the terminal Installed follows InstallRebooting", () => {
    // The crux: `firmwareStatusPhase` is not monotonic — Installed reports on
    // INSTALL yet arrives after an InstallRebooting. Reading the latest step
    // alone would show REBOOT regressing to pending.
    const states = derivePhaseStates(
      buildUpdate({
        steps: stepsFor("Downloading", "Installing", "InstallRebooting", "Installed"),
        status: "Installed",
        finishedAt: AT,
        outcome: "SUCCEEDED",
      }),
    );

    expect(states.INSTALL).toBe("done");
    expect(states.REBOOT).toBe("done");
  });

  it("SHOULD mark the phase that failed and leave the rest untouched", () => {
    const states = derivePhaseStates(
      buildUpdate({
        steps: stepsFor("Downloading", "Downloaded", "InvalidSignature"),
        status: "InvalidSignature",
        finishedAt: AT,
        outcome: "FAILED",
      }),
    );

    expect(states.DOWNLOAD).toBe("done");
    expect(states.SIGNATURE).toBe("failed");
    expect(states.INSTALL).toBe("skipped");
    expect(states.REBOOT).toBe("skipped");
  });

  it("SHOULD mark unreported phases skipped rather than pending WHEN the update is finished", () => {
    // An unsigned image never goes through SIGNATURE, and a 1.6 station never
    // reports a reboot — showing those as "still to come" on a finished update
    // would be wrong.
    const states = derivePhaseStates(
      buildUpdate({
        steps: stepsFor("Downloading", "Downloaded", "Installing", "Installed"),
        status: "Installed",
        finishedAt: AT,
        outcome: "SUCCEEDED",
      }),
    );

    expect(states.SIGNATURE).toBe("skipped");
    expect(states.REBOOT).toBe("skipped");
  });

  it("SHOULD fall back to the final status WHEN a historized update has no steps left", () => {
    // Steps are dropped on completion, so the summary's `status` is all there is.
    const states = derivePhaseStates(
      buildUpdate({
        steps: null,
        status: "DownloadFailed",
        finishedAt: AT,
        outcome: "FAILED",
      }),
    );

    expect(states.DOWNLOAD).toBe("failed");
    expect(states.INSTALL).toBe("skipped");
  });

  it("SHOULD ignore Idle, which reports on no phase at all", () => {
    const states = derivePhaseStates(buildUpdate({ steps: [], status: "Idle" }));

    expect(states).toEqual({
      DOWNLOAD: "pending",
      SIGNATURE: "pending",
      INSTALL: "pending",
      REBOOT: "pending",
    });
  });
});

describe("FirmwareTimeline", () => {
  it("SHOULD render the four phases with their derived state", () => {
    render(<FirmwareTimeline update={buildUpdate()} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0].getAttribute("data-phase")).toBe("DOWNLOAD");
    expect(items[0].getAttribute("data-state")).toBe("active");
    expect(items[3].getAttribute("data-state")).toBe("pending");
  });

  it("SHOULD warn WHEN the update is stalled", () => {
    render(<FirmwareTimeline update={buildUpdate({ isStalled: true })} />);

    expect(screen.getByText("appPage.chargePoints.firmware.stalled")).toBeTruthy();
  });

  it("SHOULD NOT warn WHEN the update is progressing normally", () => {
    render(<FirmwareTimeline update={buildUpdate()} />);

    expect(screen.queryByText("appPage.chargePoints.firmware.stalled")).toBeNull();
  });
});
