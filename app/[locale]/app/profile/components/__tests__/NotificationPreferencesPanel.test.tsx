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

const emailSwitch = () =>
  screen.getByRole("switch", { name: "appPage.profile.notifications.digestEmailEnabled.title" });
const pushSwitch = () =>
  screen.getByRole("switch", { name: "appPage.profile.notifications.digestPushEnabled.title" });

const renderPanel = (isPushSubscribed = false) =>
  render(
    <QueryClientProvider client={queryClient}>
      <NotificationPreferencesPanel isPushSubscribed={isPushSubscribed} />
    </QueryClientProvider>,
  );

describe("NotificationPreferencesPanel", () => {
  it("SHOULD show the resolved digest preferences WHEN they load", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel();

    await screen.findByText("07:00 UTC");
    expect(emailSwitch().getAttribute("aria-checked")).toBe("true");
    expect(pushSwitch().getAttribute("aria-checked")).toBe("false");
  });

  it("SHOULD reflect an opted-out user", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: false,
      digestPushEnabled: false,
      digestHourUtc: 14,
      locale: "fr",
    });

    renderPanel();

    await screen.findByText("14:00 UTC");
    expect(emailSwitch().getAttribute("aria-checked")).toBe("false");
  });

  it("SHOULD toggle the email digest opt-in WHEN its switch is clicked", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });
    updatePreferences.mockResolvedValue({
      digestEmailEnabled: false,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel();
    await screen.findByText("07:00 UTC");
    fireEvent.click(emailSwitch());

    await waitFor(() =>
      expect(updatePreferences).toHaveBeenCalledWith({ digestEmailEnabled: false }),
    );
    await waitFor(() => expect(emailSwitch().getAttribute("aria-checked")).toBe("false"));
  });

  it("SHOULD toggle the push digest opt-in WHEN its switch is clicked WHILE subscribed", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });
    updatePreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: true,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel(true);
    await screen.findByText("07:00 UTC");
    fireEvent.click(pushSwitch());

    await waitFor(() =>
      expect(updatePreferences).toHaveBeenCalledWith({ digestPushEnabled: true }),
    );
    await waitFor(() => expect(pushSwitch().getAttribute("aria-checked")).toBe("true"));
  });

  it("SHOULD disable the push digest switch WHEN the browser has no active push subscription", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel(false);

    await screen.findByText("07:00 UTC");
    expect((pushSwitch() as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText("appPage.profile.notifications.digestPushEnabled.requiresSubscription"),
    ).toBeTruthy();
  });

  it("SHOULD enable the push digest switch WHEN the browser already has an active push subscription", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel(true);

    await screen.findByText("07:00 UTC");
    expect((pushSwitch() as HTMLButtonElement).disabled).toBe(false);
    expect(
      screen.getByText("appPage.profile.notifications.digestPushEnabled.description"),
    ).toBeTruthy();
  });

  it("SHOULD disable the hour select WHEN both digest channels are opted out", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: false,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel();

    await screen.findByText("07:00 UTC");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.digestHour.title",
    });
    expect(trigger.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD keep the hour select enabled WHEN only the push channel is opted in", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: false,
      digestPushEnabled: true,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel(true);

    await screen.findByText("07:00 UTC");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.digestHour.title",
    });
    expect(trigger.hasAttribute("disabled")).toBe(false);
  });

  it("SHOULD show the resolved email language WHEN the preferences load", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "en",
    });

    renderPanel();

    await screen.findByText("07:00 UTC");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.locale.title",
    });
    expect(trigger.textContent).toContain("English");
  });

  it("SHOULD keep the language select enabled WHEN both digest channels are opted out", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: false,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });

    renderPanel();

    await screen.findByText("07:00 UTC");
    const trigger = screen.getByRole("combobox", {
      name: "appPage.profile.notifications.locale.title",
    });
    expect(trigger.hasAttribute("disabled")).toBe(false);
  });

  it("SHOULD save the language WHEN another one is picked", async () => {
    getPreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "fr",
    });
    updatePreferences.mockResolvedValue({
      digestEmailEnabled: true,
      digestPushEnabled: false,
      digestHourUtc: 7,
      locale: "en",
    });

    renderPanel();

    await screen.findByText("07:00 UTC");
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
