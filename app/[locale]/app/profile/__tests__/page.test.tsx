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

const { usePushSubscription, subscribeToPush, unsubscribeFromPush } = vi.hoisted(() => ({
  usePushSubscription: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}));

const { toastWarning, toastError } = vi.hoisted(() => ({
  toastWarning: vi.fn(),
  toastError: vi.fn(),
}));

const { isIosDevice, isStandaloneDisplayMode } = vi.hoisted(() => ({
  isIosDevice: vi.fn(),
  isStandaloneDisplayMode: vi.fn(),
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
vi.mock("../../../../../lib/pwa-install", () => ({ isIosDevice, isStandaloneDisplayMode }));
vi.mock("../../hooks/usePushSubscription", () => ({ usePushSubscription }));
vi.mock("sonner", () => ({ toast: { warning: toastWarning, error: toastError } }));

// A relative path is required here (not the usual "@/lib/api" alias): test
// files are excluded from tsconfig.json, and vite-tsconfig-paths only
// resolves "@/*" aliases for files it considers part of the project (see
// CommissioningTokenPanel.test.tsx for the same convention).
import { api } from "../../../../../lib/api";
import ProfilePage from "../page";

const defaultPushSubscriptionState = {
  isSupported: true,
  isSubscribed: false,
  isPending: false,
  isSubscribing: false,
  permission: null as NotificationPermission | null,
  subscribe: subscribeToPush,
  unsubscribe: unsubscribeFromPush,
};

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
  getPreferences
    .mockReset()
    .mockResolvedValue({ digestEnabled: true, digestHourUtc: 7, locale: "fr" });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  subscribeToPush.mockReset();
  unsubscribeFromPush.mockReset();
  toastWarning.mockReset();
  toastError.mockReset();
  isIosDevice.mockReset().mockReturnValue(false);
  isStandaloneDisplayMode.mockReset().mockReturnValue(false);
  usePushSubscription.mockReset().mockReturnValue(defaultPushSubscriptionState);
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

describe("ProfilePage push notifications section", () => {
  const pushSwitch = () => screen.getByRole("switch", { name: "appPage.profile.push.title" });

  it("SHOULD render a switch WHEN push notifications are supported", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect(pushSwitch()).toBeTruthy();
  });

  it("SHOULD render a Callout instead of a switch WHEN push notifications are not supported", () => {
    usePushSubscription.mockReturnValue({ ...defaultPushSubscriptionState, isSupported: false });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect(screen.queryByRole("switch", { name: "appPage.profile.push.title" })).toBeNull();
    expect(screen.getByText("appPage.profile.push.unsupported")).toBeTruthy();
  });

  it("SHOULD reflect an active subscription as checked", () => {
    usePushSubscription.mockReturnValue({
      ...defaultPushSubscriptionState,
      isSubscribed: true,
      permission: "granted",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect(pushSwitch().getAttribute("aria-checked")).toBe("true");
  });

  it("SHOULD disable the switch WHILE a subscribe/unsubscribe mutation is pending", () => {
    usePushSubscription.mockReturnValue({
      ...defaultPushSubscriptionState,
      isPending: true,
      isSubscribing: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    expect((pushSwitch() as HTMLButtonElement).disabled).toBe(true);
  });

  it("SHOULD call subscribe WHEN turned on", async () => {
    subscribeToPush.mockResolvedValue("granted");

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );
    fireEvent.click(pushSwitch());

    await waitFor(() => expect(subscribeToPush).toHaveBeenCalled());
    expect(unsubscribeFromPush).not.toHaveBeenCalled();
  });

  it("SHOULD call unsubscribe WHEN turned off", async () => {
    usePushSubscription.mockReturnValue({
      ...defaultPushSubscriptionState,
      isSubscribed: true,
      permission: "granted",
    });
    unsubscribeFromPush.mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );
    fireEvent.click(pushSwitch());

    await waitFor(() => expect(unsubscribeFromPush).toHaveBeenCalled());
    expect(subscribeToPush).not.toHaveBeenCalled();
  });

  it("SHOULD show a distinct blocked-notifications toast WHEN permission resolves to denied", async () => {
    subscribeToPush.mockResolvedValue("denied");

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );
    fireEvent.click(pushSwitch());

    await waitFor(() =>
      expect(toastWarning).toHaveBeenCalledWith("appPage.profile.push.toast.permissionDenied"),
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("SHOULD NOT show any toast WHEN subscribe resolves to granted", async () => {
    subscribeToPush.mockResolvedValue("granted");

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );
    fireEvent.click(pushSwitch());

    await waitFor(() => expect(subscribeToPush).toHaveBeenCalled());
    expect(toastWarning).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("SHOULD show a generic error toast WHEN subscribe rejects", async () => {
    subscribeToPush.mockRejectedValue(new Error("boom"));

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );
    fireEvent.click(pushSwitch());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("appPage.profile.push.toast.error"),
    );
    expect(toastWarning).not.toHaveBeenCalled();
  });

  it("SHOULD show a generic error toast WHEN unsubscribe rejects", async () => {
    usePushSubscription.mockReturnValue({
      ...defaultPushSubscriptionState,
      isSubscribed: true,
      permission: "granted",
    });
    unsubscribeFromPush.mockRejectedValue(new Error("boom"));

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );
    fireEvent.click(pushSwitch());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("appPage.profile.push.toast.error"),
    );
  });
});

describe("ProfilePage push notifications section on iOS", () => {
  const pushSwitch = () => screen.queryByRole("switch", { name: "appPage.profile.push.title" });

  it("SHOULD show install guidance instead of the switch WHEN on iOS and not standalone", async () => {
    isIosDevice.mockReturnValue(true);
    isStandaloneDisplayMode.mockReturnValue(false);

    renderPage();

    expect(await screen.findByText("appPage.profile.push.iosInstallRequired")).toBeTruthy();
    expect(pushSwitch()).toBeNull();
    expect(screen.queryByText("appPage.profile.push.unsupported")).toBeNull();
  });

  it("SHOULD show the switch WHEN on iOS but already running standalone", async () => {
    isIosDevice.mockReturnValue(true);
    isStandaloneDisplayMode.mockReturnValue(true);

    renderPage();

    await waitFor(() => expect(pushSwitch()).toBeTruthy());
    expect(screen.queryByText("appPage.profile.push.iosInstallRequired")).toBeNull();
  });

  it("SHOULD show the switch WHEN not on iOS at all", async () => {
    isIosDevice.mockReturnValue(false);

    renderPage();

    await waitFor(() => expect(pushSwitch()).toBeTruthy());
    expect(screen.queryByText("appPage.profile.push.iosInstallRequired")).toBeNull();
  });
});
