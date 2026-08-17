import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// A stable function reference, not a fresh closure per call: the panel's own
// useEffect depends on `t` ([t]), the same way it would on the real
// useTranslations hook's memoized return — a new reference every render
// would re-fire that effect (re-fetching getStatus) on every state change
// this component makes, clobbering state a test just set.
const translate = (key: string, params?: Record<string, unknown>) => {
  const map: Record<string, string> = {
    "common.error": "Something went wrong",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "appPage.configuration.commissioningToken.title": "Personal commissioning token",
    "appPage.configuration.commissioningToken.description": "Generate a personal token.",
    "appPage.configuration.commissioningToken.generateCta": "Generate my token",
    "appPage.configuration.commissioningToken.regenerateCta": "Regenerate",
    "appPage.configuration.commissioningToken.copyCta": "Copy token",
    "appPage.configuration.commissioningToken.exampleLabel": "Example address with your token",
    "appPage.configuration.commissioningToken.revealedWarning": "Copy this token now.",
    "appPage.configuration.commissioningToken.regenerateConfirm.title": "Regenerate the token?",
    "appPage.configuration.commissioningToken.regenerateConfirm.description":
      "The current token will stop working.",
    "appPage.configuration.commissioningToken.revokeCta": "Revoke",
    "appPage.configuration.commissioningToken.revokeConfirm.title": "Revoke the token?",
    "appPage.configuration.commissioningToken.revokeConfirm.description":
      "Already-claimed charge points stay claimed.",
  };
  if (key === "appPage.configuration.commissioningToken.createdAtLabel") {
    return `Token generated on ${params?.date}`;
  }
  return map[key] ?? key;
};

// A fixed, locale-agnostic stand-in for the real Intl-backed formatter — what
// matters here is that the component calls it (issue #281), not the exact
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CommissioningTokenPanel", () => {
  it("SHOULD show the generate CTA WHEN no token exists yet", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });

    render(<CommissioningTokenPanel />);

    expect(await screen.findByRole("button", { name: "Generate my token" })).toBeTruthy();
    expect(screen.queryByText(/Token generated on/)).toBeNull();
  });

  it("SHOULD reveal the token WHEN generated for the first time (no confirmation needed)", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });
    issueToken.mockResolvedValue({
      token: "abc123",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Generate my token" }));

    await waitFor(() => expect(issueToken).toHaveBeenCalled());
    expect(await screen.findByText("abc123")).toBeTruthy();
    expect(screen.getByText(/token=abc123/)).toBeTruthy();
  });

  it("SHOULD show a placeholder station id in the example URL, never a concrete-looking one (issue #281)", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });
    issueToken.mockResolvedValue({
      token: "abc123",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "Generate my token" }));

    expect(await screen.findByText(/<charge-point-id>\?token=abc123/)).toBeTruthy();
    expect(screen.queryByText(/CP-001/)).toBeNull();
  });

  it("SHOULD format the creation date through useFormatter, not a hardcoded locale (issue #281)", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-03-15T00:00:00.000Z",
    });

    render(<CommissioningTokenPanel />);

    expect(await screen.findByText("Token generated on formatted:2024-03-15")).toBeTruthy();
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

    fireEvent.click(await screen.findByRole("button", { name: "Regenerate" }));

    expect(await screen.findByText("Regenerate the token?")).toBeTruthy();
    expect(issueToken).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(issueToken).toHaveBeenCalled());
    expect(await screen.findByText("new-token")).toBeTruthy();
  });

  it("SHOULD NOT show a revoke option WHEN no token exists yet", async () => {
    getStatus.mockResolvedValue({ hasToken: false, createdAt: null });

    render(<CommissioningTokenPanel />);

    await screen.findByRole("button", { name: "Generate my token" });
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
  });

  it("SHOULD ask for confirmation before revoking, then reflect hasToken: false", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    revoke.mockResolvedValue(undefined);

    render(<CommissioningTokenPanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Revoke" }));

    expect(await screen.findByText("Revoke the token?")).toBeTruthy();
    expect(revoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(revoke).toHaveBeenCalled());
    // Back to the pre-token state: the generate CTA returns, revoke disappears.
    expect(await screen.findByRole("button", { name: "Generate my token" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
  });

  it("SHOULD show an error and keep the token state WHEN revoking fails", async () => {
    getStatus.mockResolvedValue({
      hasToken: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    revoke.mockRejectedValue(new Error("boom"));

    render(<CommissioningTokenPanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Revoke" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeTruthy();
  });
});
