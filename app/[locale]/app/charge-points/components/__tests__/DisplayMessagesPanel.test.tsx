import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DisplayMessageInfo, DisplayMessageReport } from "@/lib/api-display-messages";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see DeviceVariableReportsPanel.test.tsx).
const { list, requestAll } = vi.hoisted(() => ({ list: vi.fn(), requestAll: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// DeviceVariableReportsPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { DisplayMessages: { list, requestAll } },
}));

import { DisplayMessagesPanel } from "../DisplayMessagesPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildMessage = (overrides: Partial<DisplayMessageInfo> = {}): DisplayMessageInfo => ({
  id: 1,
  priority: "NormalCycle",
  message: { format: "UTF8", content: "Welcome" },
  ...overrides,
});

const buildReport = (
  overrides: Partial<DisplayMessageReport> = {},
  messageInfo: DisplayMessageInfo[] = [buildMessage()],
): DisplayMessageReport => ({
  id: "rep-1",
  chargePointId: CP_ID,
  requestId: 1,
  tbc: false,
  messageInfo,
  createdAt: AT.toISOString(),
  ...overrides,
});

const resolveWith = (reports: DisplayMessageReport[]) => list.mockResolvedValue(reports);

const renderPanel = (chargePointId = CP_ID) =>
  render(<DisplayMessagesPanel chargePointId={chargePointId} />);

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith([]);
  requestAll.mockResolvedValue({ ok: true, status: "Accepted", displayMessageRequest: {} });
});

describe("DisplayMessagesPanel", () => {
  it("SHOULD say there are no messages WHEN the history is empty", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.displayMessages.empty")).toBeTruthy();
  });

  it("SHOULD render one row per flattened message with its content", async () => {
    resolveWith([buildReport()]);

    renderPanel();

    expect(await screen.findByText("Welcome")).toBeTruthy();
  });

  it("SHOULD flatten every message across a multi-message frame", async () => {
    resolveWith([
      buildReport({}, [
        buildMessage({ id: 1, message: { format: "UTF8", content: "First" } }),
        buildMessage({ id: 2, message: { format: "UTF8", content: "Second" } }),
      ]),
    ]);

    renderPanel();

    expect(await screen.findByText("First")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    list.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.displayMessages.loadError")).toBeTruthy();
  });

  it("SHOULD cap the fetch to the panel's visible report count", async () => {
    renderPanel();

    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(list).toHaveBeenCalledWith(CP_ID, 5));

    rerender(<DisplayMessagesPanel chargePointId="cp-2" />);

    await waitFor(() => expect(list).toHaveBeenCalledWith("cp-2", 5));
  });

  it("SHOULD request every message, unfiltered, WHEN refresh is clicked", async () => {
    renderPanel();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("appPage.chargePoints.displayMessages.refresh"));

    await waitFor(() => expect(requestAll).toHaveBeenCalledWith(CP_ID));
    // A silent refetch (no loading spinner shown again), same as DeviceVariableReportsPanel's own trigger.
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it("SHOULD show an inline error WHEN the refresh request itself fails", async () => {
    requestAll.mockResolvedValue({ ok: false, httpStatus: 409 });

    renderPanel();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("appPage.chargePoints.displayMessages.refresh"));

    expect(
      await screen.findByText(
        "appPage.chargePoints.displayMessages.result.notConnectedOrUnsupported",
      ),
    ).toBeTruthy();
    // No refetch WHEN the request itself was refused.
    expect(list).toHaveBeenCalledTimes(1);
  });
});
