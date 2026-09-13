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
vi.mock("../../hooks/usePushSubscription", () => ({ usePushSubscription }));
vi.mock("sonner", () => ({ toast: { warning: toastWarning, error: toastError } }));

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

beforeEach(() => {
  useTheme.mockReset().mockReturnValue({ theme: "light", setTheme });
  setTheme.mockReset();
  getUser.mockReset().mockResolvedValue({ data: { user } });
  createClient.mockReset().mockReturnValue({ auth: { getUser } });
  subscribeToPush.mockReset();
  unsubscribeFromPush.mockReset();
  toastWarning.mockReset();
  toastError.mockReset();
  usePushSubscription.mockReset().mockReturnValue(defaultPushSubscriptionState);
});

afterEach(() => cleanup());

describe("ProfilePage", () => {
  it("SHOULD show the authenticated user's session info WHEN getUser resolves", async () => {
    render(<ProfilePage />);

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

    render(<ProfilePage />);

    expect(await screen.findByText("appPage.profile.session.notVerified")).toBeTruthy();
  });

  it("SHOULD reflect the current theme from the theme provider", () => {
    useTheme.mockReturnValue({ theme: "dark", setTheme });

    render(<ProfilePage />);

    expect(screen.getByText("appPage.profile.theme.dark")).toBeTruthy();
    expect(
      screen
        .getByRole("switch", { name: "appPage.profile.theme.title" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("SHOULD switch the theme WHEN the toggle is clicked", async () => {
    useTheme.mockReturnValue({ theme: "light", setTheme });

    render(<ProfilePage />);

    fireEvent.click(screen.getByRole("switch", { name: "appPage.profile.theme.title" }));

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith("dark"));
  });
});

describe("ProfilePage push notifications section", () => {
  const pushSwitch = () => screen.getByRole("switch", { name: "appPage.profile.push.title" });

  it("SHOULD render a switch WHEN push notifications are supported", () => {
    render(<ProfilePage />);

    expect(pushSwitch()).toBeTruthy();
  });

  it("SHOULD render a Callout instead of a switch WHEN push notifications are not supported", () => {
    usePushSubscription.mockReturnValue({ ...defaultPushSubscriptionState, isSupported: false });

    render(<ProfilePage />);

    expect(screen.queryByRole("switch", { name: "appPage.profile.push.title" })).toBeNull();
    expect(screen.getByText("appPage.profile.push.unsupported")).toBeTruthy();
  });

  it("SHOULD reflect an active subscription as checked", () => {
    usePushSubscription.mockReturnValue({
      ...defaultPushSubscriptionState,
      isSubscribed: true,
      permission: "granted",
    });

    render(<ProfilePage />);

    expect(pushSwitch().getAttribute("aria-checked")).toBe("true");
  });

  it("SHOULD disable the switch WHILE a subscribe/unsubscribe mutation is pending", () => {
    usePushSubscription.mockReturnValue({
      ...defaultPushSubscriptionState,
      isPending: true,
      isSubscribing: true,
    });

    render(<ProfilePage />);

    expect((pushSwitch() as HTMLButtonElement).disabled).toBe(true);
  });

  it("SHOULD call subscribe WHEN turned on", async () => {
    subscribeToPush.mockResolvedValue("granted");

    render(<ProfilePage />);
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

    render(<ProfilePage />);
    fireEvent.click(pushSwitch());

    await waitFor(() => expect(unsubscribeFromPush).toHaveBeenCalled());
    expect(subscribeToPush).not.toHaveBeenCalled();
  });

  it("SHOULD show a distinct blocked-notifications toast WHEN permission resolves to denied", async () => {
    subscribeToPush.mockResolvedValue("denied");

    render(<ProfilePage />);
    fireEvent.click(pushSwitch());

    await waitFor(() =>
      expect(toastWarning).toHaveBeenCalledWith("appPage.profile.push.toast.permissionDenied"),
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("SHOULD NOT show any toast WHEN subscribe resolves to granted", async () => {
    subscribeToPush.mockResolvedValue("granted");

    render(<ProfilePage />);
    fireEvent.click(pushSwitch());

    await waitFor(() => expect(subscribeToPush).toHaveBeenCalled());
    expect(toastWarning).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("SHOULD show a generic error toast WHEN subscribe rejects", async () => {
    subscribeToPush.mockRejectedValue(new Error("boom"));

    render(<ProfilePage />);
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

    render(<ProfilePage />);
    fireEvent.click(pushSwitch());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("appPage.profile.push.toast.error"),
    );
  });
});
