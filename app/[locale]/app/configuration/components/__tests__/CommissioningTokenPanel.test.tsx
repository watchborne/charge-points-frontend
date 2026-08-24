import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChargePoint } from "@watchborne/charge-points-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeChargePoint = (overrides: Partial<ChargePoint> = {}): ChargePoint => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "CP-001",
  siteId: null,
  isActive: true,
  realtimeAlertsEnabled: false,
  connection: { status: "CONNECTED", lastSeenAt: null },
  ocppVersion: "1.6",
  meta: {},
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

// A stable function reference, not a fresh closure per call: the panel's own
// useEffect depends on `t` ([t]), the same way it would on the real
// useTranslations hook's memoized return — a new reference every render
// would re-fire that effect (re-fetching getStatus) on every state change
// this component makes, clobbering state a test just set.
const translate = (key: string, params?: Record<string, unknown>) => {
  if (params && Object.keys(params).length > 0) {
    const paramList = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    return `${key}(${paramList})`;
  }
  return key;
};

// A fixed, locale-agnostic stand-in for the real Intl-backed formatter — what
// matters here is that the component calls it, not the exact
// rendered string, which is next-intl's own concern.
const formatter = {
  dateTime: (date: Date) => `formatted:${date.toISOString().slice(0, 10)}`,
};

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
  useFormatter: () => formatter,
}));

// A relative path is required here (not the usual "@/lib/api" alias): test
// files are excluded from tsconfig.json, and vite-tsconfig-paths only
// resolves "@/*" aliases for files it considers part of the project.
import { api } from "../../../../../../lib/api";
import { CommissioningTokenPanel } from "../CommissioningTokenPanel";

const getStatus = vi.spyOn(api.CommissioningToken, "getStatus");
const issueToken = vi.spyOn(api.CommissioningToken, "issueToken");
const revoke = vi.spyOn(api.CommissioningToken, "revoke");
const getMe = vi.spyOn(api.Me, "getMe");

beforeEach(() => {
  // Default: no activity to show — individual tests override this to
  // exercise the "recent commissioning activity" list (issue #420 / #278).
  getMe.mockResolvedValue({ userId: "user-1", chargePoints: [], commissioningAttempts: [] });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CommissioningTokenPanel", () => {
  it("SHOULD show the generate CTA WHEN no token exists yet", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });

    render(<CommissioningTokenPanel />);

    expect(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.generateCta",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByText(/appPage.configuration.commissioningToken.createdAtLabel/),
    ).toBeNull();
  });

  it("SHOULD reveal the token WHEN generated for the first time (no confirmation needed)", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });
    issueToken.mockResolvedValue({
      token: "abc123",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.generateCta",
      }),
    );

    await waitFor(() => expect(issueToken).toHaveBeenCalled());
    expect(await screen.findByText("abc123")).toBeTruthy();
    expect(screen.getByText(/token=abc123/)).toBeTruthy();
  });

  it("SHOULD show a placeholder station id in the example URL, never a concrete-looking one", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });
    issueToken.mockResolvedValue({
      token: "abc123",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.generateCta",
      }),
    );

    expect(
      await screen.findByText(
        /appPage.configuration.commissioningToken.exampleUrlPlaceholder\?token=abc123/,
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/CP-001/)).toBeNull();
  });

  it("SHOULD format the creation date through useFormatter, not a hardcoded locale", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-03-15T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);

    expect(
      await screen.findByText(
        /appPage.configuration.commissioningToken.createdAtLabel.*formatted:2024-03-15/,
      ),
    ).toBeTruthy();
  });

  it("SHOULD ask for confirmation before regenerating WHEN a token already exists", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    issueToken.mockResolvedValue({
      token: "new-token",
      createdAt: "2024-06-01T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.regenerateCta",
      }),
    );

    expect(
      await screen.findByText("appPage.configuration.commissioningToken.regenerateConfirm.title"),
    ).toBeTruthy();
    expect(issueToken).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "common.confirm" }));

    await waitFor(() => expect(issueToken).toHaveBeenCalled());
    expect(await screen.findByText("new-token")).toBeTruthy();
  });

  it("SHOULD NOT show a revoke option WHEN no token exists yet", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });

    render(<CommissioningTokenPanel />);

    await screen.findByRole("button", {
      name: "appPage.configuration.commissioningToken.generateCta",
    });
    expect(
      screen.queryByRole("button", { name: "appPage.configuration.commissioningToken.revokeCta" }),
    ).toBeNull();
  });

  it("SHOULD ask for confirmation before revoking, then reflect hasToken: false", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    revoke.mockResolvedValue(undefined);

    render(<CommissioningTokenPanel />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.revokeCta",
      }),
    );

    expect(
      await screen.findByText("appPage.configuration.commissioningToken.revokeConfirm.title"),
    ).toBeTruthy();
    expect(revoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "common.confirm" }));

    await waitFor(() => expect(revoke).toHaveBeenCalled());
    // Back to the pre-token state: the generate CTA returns, revoke disappears.
    expect(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.generateCta",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "appPage.configuration.commissioningToken.revokeCta" }),
    ).toBeNull();
  });

  it("SHOULD show an error and keep the token state WHEN revoking fails", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    revoke.mockRejectedValue(new Error("boom"));

    render(<CommissioningTokenPanel />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "appPage.configuration.commissioningToken.revokeCta",
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "common.confirm" }));

    expect(await screen.findByText("common.error")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "appPage.configuration.commissioningToken.revokeCta" }),
    ).toBeTruthy();
  });

  it("SHOULD NOT show recent activity WHEN there are no commissioning attempts", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });

    render(<CommissioningTokenPanel />);

    await screen.findByRole("button", {
      name: "appPage.configuration.commissioningToken.generateCta",
    });
    expect(
      screen.queryByText("appPage.configuration.commissioningToken.recentActivity.title"),
    ).toBeNull();
  });

  it("SHOULD render a claim, resolving the station name from Me.chargePoints", async () => {
    getStatus.mockResolvedValue({ hasToken: true, createdAt: "2024-01-01T00:00:00.000Z" });
    getMe.mockResolvedValue({
      userId: "user-1",
      chargePoints: [makeChargePoint({ id: "cp-1", name: "Station Nord" })],
      commissioningAttempts: [
        {
          id: "attempt-1",
          chargePointId: "cp-1",
          attemptedAt: "2024-06-01T10:00:00.000Z",
          outcome: "CLAIMED",
        },
      ],
    });

    render(<CommissioningTokenPanel />);

    expect(
      await screen.findByText("appPage.configuration.commissioningToken.recentActivity.title"),
    ).toBeTruthy();
    expect(
      screen.getByText("appPage.configuration.commissioningToken.recentActivity.outcomes.CLAIMED"),
    ).toBeTruthy();
    expect(screen.getByText("Station Nord")).toBeTruthy();
  });

  it("SHOULD render a refused claim WHEN the station belongs to another installer", async () => {
    getStatus.mockResolvedValue({ hasToken: true, createdAt: "2024-01-01T00:00:00.000Z" });
    getMe.mockResolvedValue({
      userId: "user-1",
      chargePoints: [],
      commissioningAttempts: [
        {
          id: "attempt-2",
          chargePointId: "cp-2",
          attemptedAt: "2024-06-02T10:00:00.000Z",
          outcome: "ALREADY_CLAIMED_BY_OTHER",
        },
      ],
    });

    render(<CommissioningTokenPanel />);

    expect(
      await screen.findByText(
        "appPage.configuration.commissioningToken.recentActivity.outcomes.ALREADY_CLAIMED_BY_OTHER",
      ),
    ).toBeTruthy();
    // Not in the caller's own chargePoints (belongs to someone else) — falls back to the raw id.
    expect(screen.getByText("cp-2")).toBeTruthy();
  });

  it("SHOULD sort commissioning attempts newest first and cap the list at 5", async () => {
    getStatus.mockResolvedValue({ hasToken: true, createdAt: "2024-01-01T00:00:00.000Z" });
    const attempts = Array.from({ length: 6 }, (_, i) => ({
      id: `attempt-${i}`,
      chargePointId: `cp-${i}`,
      attemptedAt: new Date(2024, 0, i + 1).toISOString(),
      outcome: "CLAIMED" as const,
    }));
    getMe.mockResolvedValue({
      userId: "user-1",
      chargePoints: [],
      commissioningAttempts: attempts,
    });

    render(<CommissioningTokenPanel />);

    await screen.findByText("appPage.configuration.commissioningToken.recentActivity.title");
    // Newest (attempt-5, Jan 6th) is present; oldest (attempt-0, Jan 1st) is dropped by the 5-item cap.
    expect(screen.getByText("cp-5")).toBeTruthy();
    expect(screen.queryByText("cp-0")).toBeNull();
  });
});
