import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuditEntry, AuditEntryPage } from "@/lib/api-audit";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see SecurityEventsPanel.test.tsx).
const { listForChargePoint } = vi.hoisted(() => ({ listForChargePoint: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// SecurityEventsPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { Audit: { listForChargePoint } },
}));

import { ActivityPanel } from "../ActivityPanel";

afterEach(() => cleanup());

const CP_ID = "cp-1";
const AT = new Date("2026-08-09T12:00:00Z");

const buildEntry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  id: "audit-1",
  occurredAt: AT.toISOString(),
  actor: { kind: "USER", userId: "user-1", email: "alice@example.com" },
  action: "CHARGE_POINT_RESET",
  target: { chargePointId: CP_ID, siteId: null, customerId: null },
  payload: {},
  outcome: "SUCCEEDED",
  outcomeDetail: null,
  correlationId: "corr-1",
  completedAt: AT.toISOString(),
  ...overrides,
});

const buildPage = (items: AuditEntry[], nextCursor: string | null = null): AuditEntryPage => ({
  items,
  nextCursor,
});

const resolveWith = (page: AuditEntryPage) => listForChargePoint.mockResolvedValue(page);

let queryClient: QueryClient;

const renderPanel = (chargePointId = CP_ID) =>
  render(
    <QueryClientProvider client={queryClient}>
      <ActivityPanel chargePointId={chargePointId} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith(buildPage([]));
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe("ActivityPanel", () => {
  it("SHOULD say there is no activity WHEN the trail is empty", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.activity.empty")).toBeTruthy();
  });

  it("SHOULD render a USER actor as their email", async () => {
    resolveWith(
      buildPage([
        buildEntry({ actor: { kind: "USER", userId: "user-1", email: "alice@example.com" } }),
      ]),
    );

    renderPanel();

    expect(await screen.findByText(/alice@example\.com/)).toBeTruthy();
  });

  it("SHOULD render a SYSTEM actor as 'System — <source>'", async () => {
    resolveWith(
      buildPage([buildEntry({ actor: { kind: "SYSTEM", source: "FIRMWARE_CAMPAIGN" } })]),
    );

    renderPanel();

    expect(
      await screen.findByText(
        "appPage.activity.systemActor — appPage.activity.systemSources.FIRMWARE_CAMPAIGN",
      ),
    ).toBeTruthy();
  });

  it("SHOULD render the action's i18n label", async () => {
    resolveWith(buildPage([buildEntry({ action: "CONNECTOR_UNLOCK" })]));

    renderPanel();

    expect(await screen.findByText("appPage.activity.actions.CONNECTOR_UNLOCK")).toBeTruthy();
  });

  it.each([
    ["SUCCEEDED", "appPage.activity.outcomes.succeeded"],
    ["REJECTED", "appPage.activity.outcomes.rejected"],
    ["FAILED", "appPage.activity.outcomes.failed"],
    ["TIMED_OUT", "appPage.activity.outcomes.timedOut"],
    ["PENDING", "appPage.activity.outcomes.pending"],
  ] as const)("SHOULD render the %s outcome badge", async (outcome, expectedKey) => {
    resolveWith(buildPage([buildEntry({ outcome })]));

    renderPanel();

    expect(await screen.findByText(expectedKey)).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    listForChargePoint.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.activity.error")).toBeTruthy();
  });

  it("SHOULD NOT show a 'load more' control WHEN there is no next page", async () => {
    resolveWith(buildPage([buildEntry()], null));

    renderPanel();

    await screen.findByText("appPage.activity.actions.CHARGE_POINT_RESET");
    expect(screen.queryByText("appPage.activity.loadMore")).toBeNull();
  });

  it("SHOULD fetch the next page WHEN 'load more' is clicked", async () => {
    listForChargePoint
      .mockResolvedValueOnce(buildPage([buildEntry({ id: "audit-1" })], "cursor-1"))
      .mockResolvedValueOnce(
        buildPage([buildEntry({ id: "audit-2", action: "CONNECTOR_UNLOCK" })]),
      );

    renderPanel();

    const loadMore = await screen.findByText("appPage.activity.loadMore");
    loadMore.click();

    expect(await screen.findByText("appPage.activity.actions.CONNECTOR_UNLOCK")).toBeTruthy();
    await waitFor(() =>
      expect(listForChargePoint).toHaveBeenLastCalledWith(
        CP_ID,
        expect.objectContaining({ cursor: "cursor-1" }),
      ),
    );
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(listForChargePoint).toHaveBeenCalledWith(CP_ID, expect.anything()));

    rerender(
      <QueryClientProvider client={queryClient}>
        <ActivityPanel chargePointId="cp-2" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(listForChargePoint).toHaveBeenCalledWith("cp-2", expect.anything()));
  });
});
