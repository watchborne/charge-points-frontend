import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
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
    };
    if (key === "appPage.configuration.commissioningToken.createdAtLabel") {
      return `Token generated on ${params?.date}`;
    }
    return map[key] ?? key;
  },
}));

// A relative path is required here (not the usual "@/lib/api" alias): test
// files are excluded from tsconfig.json, and vite-tsconfig-paths only
// resolves "@/*" aliases for files it considers part of the project.
import { api } from "../../../../../../lib/api";
import { CommissioningTokenPanel } from "../CommissioningTokenPanel";

const getStatus = vi.spyOn(api.CommissioningToken, "getStatus");
const issueToken = vi.spyOn(api.CommissioningToken, "issueToken");

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
});
