import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// This hook is genuinely fiddly to test in jsdom: none of
// serviceWorker/PushManager/Notification/PushSubscription exist there by
// default, so every browser API this hook touches is hand-stubbed below —
// real PushManager/service-worker behavior (actual subscribe network
// round-trips, pushsubscriptionchange delivery, browser-side permission UI)
// is out of reach here and isn't covered by this suite.
const { subscribeApi, unsubscribeApi } = vi.hoisted(() => ({
  subscribeApi: vi.fn(),
  unsubscribeApi: vi.fn(),
}));

// Relative paths, not the "@/..." alias, matching app/__tests__/useSites.test.ts's
// own vi.mock("../../lib/api", ...) — mocking these two by path alone (an
// alternative, equally-valid repo convention is the alias form used by e.g.
// app/auth/components/__tests__/LogoutButton.test.tsx's
// vi.mock("@/i18n/navigation", ...)).
vi.mock("../../../../../lib/api", () => ({
  api: { PushSubscriptions: { subscribe: subscribeApi, unsubscribe: unsubscribeApi } },
}));

// A fixed, valid-looking base64url string — its actual bytes never matter,
// only that urlBase64ToUint8Array() (given real base64url input) doesn't
// throw and that the resulting Uint8Array reaches pushManager.subscribe.
vi.mock("../../../../../lib/constants", () => ({
  VAPID_PUBLIC_KEY: "dGVzdC12YXBpZC1rZXk",
}));

import { usePushSubscription } from "../usePushSubscription";

function renderUsePushSubscription() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => usePushSubscription(), { wrapper });
}

const mockGetRegistration = vi.fn();
const mockRegister = vi.fn();
const mockRequestPermission = vi.fn();

function stubSupportedBrowser() {
  Object.defineProperty(navigator, "serviceWorker", {
    value: { getRegistration: mockGetRegistration, register: mockRegister },
    configurable: true,
  });
  (window as unknown as { PushManager: unknown }).PushManager = function PushManager() {};
  (globalThis as unknown as { Notification: unknown }).Notification = {
    permission: "default",
    requestPermission: mockRequestPermission,
  };
}

function fakeRegistration(overrides: Partial<ServiceWorkerRegistration> = {}) {
  return {
    active: { postMessage: vi.fn() },
    pushManager: { subscribe: vi.fn(), getSubscription: vi.fn() },
    ...overrides,
  } as unknown as ServiceWorkerRegistration & {
    active: { postMessage: ReturnType<typeof vi.fn> };
    pushManager: { subscribe: ReturnType<typeof vi.fn>; getSubscription: ReturnType<typeof vi.fn> };
  };
}

beforeEach(() => {
  subscribeApi.mockReset();
  unsubscribeApi.mockReset();
  mockGetRegistration.mockReset();
  mockRegister.mockReset();
  mockRequestPermission.mockReset().mockResolvedValue("granted");
  stubSupportedBrowser();
});

afterEach(() => {
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
  delete (window as unknown as { PushManager?: unknown }).PushManager;
  delete (globalThis as unknown as { Notification?: unknown }).Notification;
  vi.restoreAllMocks();
});

describe("isSupported", () => {
  it("SHOULD be true WHEN serviceWorker and PushManager are both available", () => {
    const { result } = renderUsePushSubscription();

    expect(result.current.isSupported).toBe(true);
  });

  it("SHOULD be false WHEN serviceWorker is missing", () => {
    delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;

    const { result } = renderUsePushSubscription();

    expect(result.current.isSupported).toBe(false);
  });

  it("SHOULD be false WHEN PushManager is missing", () => {
    delete (window as unknown as { PushManager?: unknown }).PushManager;

    const { result } = renderUsePushSubscription();

    expect(result.current.isSupported).toBe(false);
  });
});

describe("subscribe", () => {
  it("SHOULD register the service worker, request permission, subscribe, and post the subscription to the API WHEN not already registered", async () => {
    const registration = fakeRegistration();
    mockGetRegistration.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(registration);
    registration.pushManager.subscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: "https://push.example/abc",
        keys: { p256dh: "p256dh-value", auth: "auth-value" },
      }),
    });
    subscribeApi.mockResolvedValue({
      endpoint: "https://push.example/abc",
      createdAt: "2026-09-01T00:00:00.000Z",
    });

    const { result } = renderUsePushSubscription();

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockGetRegistration).toHaveBeenCalledWith("/sw.js");
    expect(mockRegister).toHaveBeenCalledWith("/sw.js");
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(registration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      }),
    );
    expect(subscribeApi).toHaveBeenCalledWith("https://push.example/abc", {
      p256dh: "p256dh-value",
      auth: "auth-value",
    });
    expect(registration.active.postMessage).toHaveBeenCalledWith({
      type: "SET_VAPID_PUBLIC_KEY",
      key: "dGVzdC12YXBpZC1rZXk",
    });
  });

  it("SHOULD reuse an existing registration instead of registering again", async () => {
    const registration = fakeRegistration();
    mockGetRegistration.mockResolvedValue(registration);
    registration.pushManager.subscribe.mockResolvedValue({
      toJSON: () => ({ endpoint: "https://push.example/abc", keys: { p256dh: "a", auth: "b" } }),
    });
    subscribeApi.mockResolvedValue({ endpoint: "https://push.example/abc", createdAt: "now" });

    const { result } = renderUsePushSubscription();

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("SHOULD update permission and NOT subscribe WHEN permission is denied", async () => {
    mockRequestPermission.mockResolvedValue("denied");
    mockGetRegistration.mockResolvedValue(fakeRegistration());

    const { result } = renderUsePushSubscription();

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => expect(result.current.permission).toBe("denied"));
    expect(subscribeApi).not.toHaveBeenCalled();
  });

  it("SHOULD log an error and do nothing browser-side WHEN the VAPID key is not set", async () => {
    // Isolated per-test module graph: lib/constants is mocked with an empty
    // key here only, so it can't leak into the "granted"-path tests above via
    // a shared static vi.mock factory.
    vi.resetModules();
    vi.doMock("../../../../../lib/constants", () => ({ VAPID_PUBLIC_KEY: "" }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { usePushSubscription: usePushSubscriptionWithNoKey } =
      await import("../usePushSubscription");
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => usePushSubscriptionWithNoKey(), { wrapper });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("NEXT_PUBLIC_VAPID_PUBLIC_KEY"));
    expect(mockRegister).not.toHaveBeenCalled();
    expect(subscribeApi).not.toHaveBeenCalled();

    vi.doUnmock("../../../../../lib/constants");
  });
});

describe("unsubscribe", () => {
  it("SHOULD unsubscribe browser-side and notify the API WHEN a subscription exists", async () => {
    const unsubscribeBrowserSide = vi.fn().mockResolvedValue(true);
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue({
      endpoint: "https://push.example/abc",
      unsubscribe: unsubscribeBrowserSide,
    });
    mockGetRegistration.mockResolvedValue(registration);
    unsubscribeApi.mockResolvedValue(undefined);

    const { result } = renderUsePushSubscription();

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(unsubscribeApi).toHaveBeenCalledWith("https://push.example/abc");
    expect(unsubscribeBrowserSide).toHaveBeenCalled();
  });

  it("SHOULD do nothing WHEN there is no existing subscription", async () => {
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue(null);
    mockGetRegistration.mockResolvedValue(registration);

    const { result } = renderUsePushSubscription();

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(unsubscribeApi).not.toHaveBeenCalled();
  });

  it("SHOULD do nothing WHEN there is no registration at all", async () => {
    mockGetRegistration.mockResolvedValue(undefined);

    const { result } = renderUsePushSubscription();

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(unsubscribeApi).not.toHaveBeenCalled();
  });
});
