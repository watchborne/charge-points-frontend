import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const translate = (key: string) => key;

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
}));

// A relative path is required here (not the usual "@/lib/api" alias): test
// files are excluded from tsconfig.json, and vite-tsconfig-paths only
// resolves "@/*" aliases for files it considers part of the project (see
// CommissioningTokenPanel.test.tsx for the same convention).
import { api } from "../../../../../../lib/api";
import { NotificationPreferencesPanel } from "../NotificationPreferencesPanel";

const getPreferences = vi.spyOn(api.NotificationPreferences, "getPreferences");
const updatePreferences = vi.spyOn(api.NotificationPreferences, "updatePreferences");

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderPanel = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <NotificationPreferencesPanel />
    </QueryClientProvider>,
  );

describe("NotificationPreferencesPanel", () => {
  it("SHOULD show the resolved digest preferences WHEN they load", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7 });

    renderPanel();

    const toggle = await screen.findByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("07:00 UTC")).toBeTruthy();
  });

  it("SHOULD reflect an opted-out user", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 14 });

    renderPanel();

    const toggle = await screen.findByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("SHOULD toggle the digest opt-in WHEN the switch is clicked", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7 });
    updatePreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 7 });

    renderPanel();

    const toggle = await screen.findByRole("switch");
    fireEvent.click(toggle);

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith({ digestEnabled: false }));
    await waitFor(() => expect(toggle.getAttribute("aria-checked")).toBe("false"));
  });

  it("SHOULD disable the hour select WHEN the digest is opted out", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 7 });

    renderPanel();

    await screen.findByRole("switch");
    const trigger = screen.getByRole("combobox");
    expect(trigger.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD show an error WHEN the preferences fail to load", async () => {
    getPreferences.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("common.error")).toBeTruthy();
  });
});
