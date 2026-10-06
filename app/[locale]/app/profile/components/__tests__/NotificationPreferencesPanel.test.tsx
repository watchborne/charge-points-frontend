import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

// Radix Select drives its listbox through pointer capture and scrollIntoView,
// which jsdom lacks (same stubs as DeleteCertificateDialog.test.tsx).
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

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
    getPreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7, locale: "fr" });

    renderPanel();

    const toggle = await screen.findByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("07:00 UTC")).toBeTruthy();
  });

  it("SHOULD reflect an opted-out user", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 14, locale: "fr" });

    renderPanel();

    const toggle = await screen.findByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("SHOULD toggle the digest opt-in WHEN the switch is clicked", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7, locale: "fr" });
    updatePreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 7, locale: "fr" });

    renderPanel();

    const toggle = await screen.findByRole("switch");
    fireEvent.click(toggle);

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith({ digestEnabled: false }));
    await waitFor(() => expect(toggle.getAttribute("aria-checked")).toBe("false"));
  });

  it("SHOULD disable the hour select WHEN the digest is opted out", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 7, locale: "fr" });

    renderPanel();

    await screen.findByRole("switch");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.digestHour.title",
    });
    expect(trigger.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD show the resolved email language WHEN the preferences load", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7, locale: "en" });

    renderPanel();

    await screen.findByRole("switch");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.locale.title",
    });
    expect(trigger.textContent).toContain("English");
  });

  it("SHOULD keep the language select enabled WHEN the digest is opted out", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: false, digestHourUtc: 7, locale: "fr" });

    renderPanel();

    await screen.findByRole("switch");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.locale.title",
    });
    expect(trigger.hasAttribute("disabled")).toBe(false);
  });

  it("SHOULD save the language WHEN another one is picked", async () => {
    getPreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7, locale: "fr" });
    updatePreferences.mockResolvedValue({ digestEnabled: true, digestHourUtc: 7, locale: "en" });

    renderPanel();

    await screen.findByRole("switch");
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "appPage.profile.notifications.locale.title" }),
      { key: "ArrowDown" },
    );
    fireEvent.click(await screen.findByRole("option", { name: "English" }));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith({ locale: "en" }));
  });

  it("SHOULD show an error WHEN the preferences fail to load", async () => {
    getPreferences.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("common.error")).toBeTruthy();
  });
});
