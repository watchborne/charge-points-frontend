import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see FirmwarePanel.test.tsx).
const { getLogUpload, listLogUploads } = vi.hoisted(() => ({
  getLogUpload: vi.fn(),
  listLogUploads: vi.fn(),
}));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// FirmwarePanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { getLogUpload, listLogUploads } },
}));

import type { ChargePointLogUpload, LogUploadView } from "@/types/log-upload";

import { LogUploadPanel } from "../LogUploadPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildUpload = (overrides: Partial<LogUploadView> = {}): LogUploadView =>
  ({
    id: "log-1",
    chargePointId: CP_ID,
    logType: "DiagnosticsLog",
    remoteLocation: "https://uploads.example.com/logs",
    fileName: null,
    status: "Uploading",
    steps: [{ status: "Uploading", occurredAt: AT }],
    startedAt: AT,
    finishedAt: null,
    outcome: null,
    createdAt: AT,
    updatedAt: AT,
    isStalled: false,
    ...overrides,
  }) as LogUploadView;

const HISTORIZED = buildUpload({
  id: "log-0",
  status: "Uploaded",
  steps: null,
  fileName: "diagnostics-2026-08-09.zip",
  finishedAt: AT,
  outcome: "SUCCEEDED",
});

const resolveWith = (logUpload: ChargePointLogUpload, history: LogUploadView[] = []) => {
  getLogUpload.mockResolvedValue(logUpload);
  listLogUploads.mockResolvedValue(history);
};

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith({ active: null, lastCompleted: null });
});

const renderPanel = (ocppVersion: "1.6" | "2.0.1" = "2.0.1") =>
  render(<LogUploadPanel chargePointId={CP_ID} ocppVersion={ocppVersion} />);

describe("LogUploadPanel", () => {
  it("SHOULD show a loading state WHILE fetching", () => {
    renderPanel();

    expect(screen.getByText("appPage.chargePoints.logUpload.loading")).toBeTruthy();
  });

  it("SHOULD say so WHEN the charge point has never had a log uploaded", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.neverUploaded")).toBeTruthy();
  });

  it("SHOULD show the current status WHEN an upload is in flight", async () => {
    resolveWith({ active: buildUpload(), lastCompleted: null });

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.inProgress")).toBeTruthy();
    expect(screen.getByText("appPage.chargePoints.logUpload.statuses.Uploading")).toBeTruthy();
  });

  it("SHOULD flag a stalled upload", async () => {
    resolveWith({ active: buildUpload({ isStalled: true }), lastCompleted: null });

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.stalled")).toBeTruthy();
  });

  it("SHOULD show the last upload with its file name", async () => {
    resolveWith({ active: null, lastCompleted: HISTORIZED });

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.lastUpload")).toBeTruthy();
    expect(screen.getByText(/diagnostics-2026-08-09\.zip/)).toBeTruthy();
  });

  it("SHOULD surface the terminal status WHEN the last upload failed", async () => {
    resolveWith({
      active: null,
      lastCompleted: buildUpload({
        status: "UploadFailed",
        steps: null,
        finishedAt: AT,
        outcome: "FAILED",
      }),
    });

    renderPanel();

    expect(
      await screen.findAllByText("appPage.chargePoints.logUpload.statuses.UploadFailed"),
    ).not.toHaveLength(0);
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    getLogUpload.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.loadError")).toBeTruthy();
  });

  it("SHOULD render the upload history", async () => {
    resolveWith({ active: null, lastCompleted: HISTORIZED }, [HISTORIZED, buildUpload()]);

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.history.title")).toBeTruthy();
    expect(
      screen.getAllByText("appPage.chargePoints.logUpload.logTypes.DiagnosticsLog"),
    ).toHaveLength(2);
  });

  it("SHOULD say so WHEN the history is empty", async () => {
    resolveWith({ active: null, lastCompleted: null }, []);

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.logUpload.history.empty")).toBeTruthy();
  });

  it("SHOULD surface a history load failure independently of the main state", async () => {
    getLogUpload.mockResolvedValue({ active: null, lastCompleted: null });
    listLogUploads.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.logUpload.history.loadError"),
    ).toBeTruthy();
    // The main section still renders — only the history fetch failed.
    expect(screen.getByText("appPage.chargePoints.logUpload.neverUploaded")).toBeTruthy();
  });

  it("SHOULD disable the trigger WHILE an upload is in flight", async () => {
    resolveWith({ active: buildUpload(), lastCompleted: null });

    renderPanel();

    const trigger = (
      await screen.findByText("appPage.chargePoints.logUpload.start.button")
    ).closest("button");
    expect(trigger?.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD enable the trigger WHEN nothing is in flight", async () => {
    resolveWith({ active: null, lastCompleted: HISTORIZED });

    renderPanel();

    const trigger = (
      await screen.findByText("appPage.chargePoints.logUpload.start.button")
    ).closest("button");
    expect(trigger?.hasAttribute("disabled")).toBe(false);
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(getLogUpload).toHaveBeenCalledWith(CP_ID));

    rerender(<LogUploadPanel chargePointId="cp-2" ocppVersion="2.0.1" />);

    await waitFor(() => expect(getLogUpload).toHaveBeenCalledWith("cp-2"));
  });
});
