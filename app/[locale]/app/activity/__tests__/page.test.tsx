import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Inline `import(...)` type reference rather than a top-level `import type`:
// import/order groups every ImportDeclaration in the file together
// regardless of the vi.mock calls between them, and a plain `import type`
// here — at a different "../" depth than the fixtures below — breaks that
// grouping.
type AuditEntry = import("../../../../../lib/api-audit").AuditEntry;

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { useAuditTrailMock, useChargePointsMock, useSitesMock } = vi.hoisted(() => ({
  useAuditTrailMock: vi.fn(),
  useChargePointsMock: vi.fn(),
  useSitesMock: vi.fn(),
}));

vi.mock("../../hooks/useAuditTrail", () => ({ useAuditTrail: useAuditTrailMock }));
vi.mock("../../hooks/useChargePoints", () => ({ useChargePoints: useChargePointsMock }));
vi.mock("../../hooks/useSites", () => ({ useSites: useSitesMock }));

import { createChargePoint } from "../../../../__tests__/fixtures/charge-point";
import { createSite } from "../../../../__tests__/fixtures/site";
import ActivityPage from "../page";

afterEach(() => cleanup());

const AT = new Date("2026-08-09T12:00:00Z");

const buildEntry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  id: "audit-1",
  occurredAt: AT.toISOString(),
  actor: { kind: "USER", userId: "user-1", email: "alice@example.com" },
  action: "CHARGE_POINT_RESET",
  target: { chargePointId: null, siteId: null, customerId: null },
  payload: {},
  outcome: "SUCCEEDED",
  outcomeDetail: null,
  correlationId: "corr-1",
  completedAt: AT.toISOString(),
  ...overrides,
});

const defaultAuditTrail = {
  entries: [] as AuditEntry[],
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuditTrailMock.mockReturnValue(defaultAuditTrail);
  useChargePointsMock.mockReturnValue({ chargePoints: [], loading: false, error: null });
  useSitesMock.mockReturnValue({ sites: [], loading: false, error: null });
});

describe("ActivityPage", () => {
  it("SHOULD say no activity matches WHEN the trail is empty", () => {
    render(<ActivityPage />);

    expect(screen.getByText("appPage.activity.empty")).toBeTruthy();
  });

  it("SHOULD resolve a row's charge point target to its name", () => {
    const cp = createChargePoint({ id: "cp-1", name: "Lyon depot" });
    useChargePointsMock.mockReturnValue({ chargePoints: [cp], loading: false, error: null });
    useAuditTrailMock.mockReturnValue({
      ...defaultAuditTrail,
      entries: [buildEntry({ target: { chargePointId: "cp-1", siteId: null, customerId: null } })],
    });

    render(<ActivityPage />);

    expect(screen.getByText(/Lyon depot/)).toBeTruthy();
  });

  it("SHOULD fall back to the raw id WHEN the target charge point isn't in the caller's scope", () => {
    useAuditTrailMock.mockReturnValue({
      ...defaultAuditTrail,
      entries: [
        buildEntry({ target: { chargePointId: "unknown-cp", siteId: null, customerId: null } }),
      ],
    });

    render(<ActivityPage />);

    expect(screen.getByText(/unknown-cp/)).toBeTruthy();
  });

  it("SHOULD resolve a row's site target to its name", () => {
    const site = createSite({ id: "site-1", name: "Paris HQ" });
    useSitesMock.mockReturnValue({ sites: [site], loading: false, error: null });
    useAuditTrailMock.mockReturnValue({
      ...defaultAuditTrail,
      entries: [
        buildEntry({
          action: "SITE_UPDATED",
          target: { chargePointId: null, siteId: "site-1", customerId: null },
        }),
      ],
    });

    render(<ActivityPage />);

    expect(screen.getByText(/Paris HQ/)).toBeTruthy();
  });

  it("SHOULD pass the typed user filter through to the audit trail hook", () => {
    render(<ActivityPage />);

    fireEvent.change(screen.getByLabelText("appPage.activity.page.filters.user"), {
      target: { value: "user-42" },
    });

    const lastCall = useAuditTrailMock.mock.calls.at(-1)?.[0];
    expect(lastCall.filters.actorUserId).toBe("user-42");
  });

  it("SHOULD pass the typed customer filter through to the audit trail hook", () => {
    render(<ActivityPage />);

    fireEvent.change(screen.getByLabelText("appPage.activity.page.filters.customer"), {
      target: { value: "customer-7" },
    });

    const lastCall = useAuditTrailMock.mock.calls.at(-1)?.[0];
    expect(lastCall.filters.customerId).toBe("customer-7");
  });

  it("SHOULD build the CSV export link from the current filters", () => {
    render(<ActivityPage />);

    fireEvent.change(screen.getByLabelText("appPage.activity.page.filters.user"), {
      target: { value: "user-42" },
    });

    const exportLink = screen.getByText("appPage.activity.page.exportCsv").closest("a");
    expect(exportLink?.getAttribute("href")).toContain("actorUserId=user-42");
  });

  it("SHOULD surface a load failure rather than rendering an empty page", () => {
    useAuditTrailMock.mockReturnValue({ ...defaultAuditTrail, isError: true });

    render(<ActivityPage />);

    expect(screen.getByText("appPage.activity.error")).toBeTruthy();
  });
});
