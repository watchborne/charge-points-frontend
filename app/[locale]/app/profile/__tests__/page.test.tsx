import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const translate = (key: string) => key;

const formatter = {
  dateTime: (date: Date) => `formatted:${date.toISOString().slice(0, 10)}`,
};

const { useTheme, setTheme } = vi.hoisted(() => ({
  useTheme: vi.fn(),
  setTheme: vi.fn(),
}));

const { getUser, createClient } = vi.hoisted(() => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
  useFormatter: () => formatter,
}));

// Relative target, not the "@/" alias: this project's Vitest config does not
// alias "@/" for the mock resolver, so an aliased vi.mock target silently
// fails to intercept (see CommissioningTokenPanel.test.tsx for the same
// convention).
vi.mock("../../../../components/ThemeProvider", () => ({ useTheme }));
vi.mock("../../../../../lib/supabase/client", () => ({ createClient }));

// A relative path is required here (not the usual "@/lib/api" alias): test
// files are excluded from tsconfig.json, and vite-tsconfig-paths only
// resolves "@/*" aliases for files it considers part of the project (see
// CommissioningTokenPanel.test.tsx for the same convention).
import { api } from "../../../../../lib/api";
import ProfilePage from "../page";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "installer@example.com",
  last_sign_in_at: "2024-03-01T10:30:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  user_metadata: { email_verified: true },
};

const getPreferences = vi.spyOn(api.NotificationPreferences, "getPreferences");

let queryClient: QueryClient;

beforeEach(() => {
  useTheme.mockReset().mockReturnValue({ theme: "light", setTheme });
  setTheme.mockReset();
  getUser.mockReset().mockResolvedValue({ data: { user } });
  createClient.mockReset().mockReturnValue({ auth: { getUser } });
  getPreferences.mockReset().mockResolvedValue({ digestEnabled: true, digestHourUtc: 7 });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <ProfilePage />
    </QueryClientProvider>,
  );

describe("ProfilePage", () => {
  it("SHOULD show the authenticated user's session info WHEN getUser resolves", async () => {
    renderPage();

    expect(await screen.findByText(user.id)).toBeTruthy();
    expect(screen.getByText(user.email)).toBeTruthy();
    expect(screen.getByText("formatted:2024-03-01")).toBeTruthy();
    expect(screen.getByText("formatted:2024-01-01")).toBeTruthy();
    expect(screen.getByText("appPage.profile.session.verified")).toBeTruthy();
  });

  it("SHOULD show the not-verified state WHEN email_verified is false", async () => {
    getUser.mockResolvedValue({
      data: { user: { ...user, user_metadata: { email_verified: false } } },
    });

    renderPage();

    expect(await screen.findByText("appPage.profile.session.notVerified")).toBeTruthy();
  });

  it("SHOULD reflect the current theme from the theme provider", () => {
    useTheme.mockReturnValue({ theme: "dark", setTheme });

    renderPage();

    expect(screen.getByText("appPage.profile.theme.dark")).toBeTruthy();
    expect(
      screen
        .getByRole("switch", { name: "appPage.profile.theme.title" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("SHOULD switch the theme WHEN the toggle is clicked", async () => {
    useTheme.mockReturnValue({ theme: "light", setTheme });

    renderPage();

    fireEvent.click(screen.getByRole("switch", { name: "appPage.profile.theme.title" }));

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith("dark"));
  });

  it("SHOULD show the notification preferences panel WHEN preferences load", async () => {
    renderPage();

    const digestToggle = await screen.findByRole("switch", {
      name: "appPage.profile.notifications.digestEnabled.title",
    });
    expect(digestToggle.getAttribute("aria-checked")).toBe("true");
  });
});
