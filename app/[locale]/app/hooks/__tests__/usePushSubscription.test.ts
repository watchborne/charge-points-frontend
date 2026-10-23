import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// None of serviceWorker/PushManager/Notification exist in jsdom: every browser
// API is stubbed, so real subscription round trips aren't covered here.
const { subscribeApi, unsubscribeApi } = vi.hoisted(() => ({
  subscribeApi: vi.fn(),
  unsubscribeApi: vi.fn(),
}));

vi.mock("../../../../../lib/api", () => ({
  api: { PushSubscriptions: { subscribe: subscribeApi, unsubscribe: unsubscribeApi } },
}));

// Any valid base64url string: only that the conversion succeeds matters.
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
// The hook awaits `.ready` for the active worker, not `register()`'s value.
const mockReady = vi.fn();

function stubSupportedBrowser() {
  Object.defineProperty(navigator, "serviceWorker", {
    value: { getRegistration: mockGetRegistration, register: mockRegister },
    configurable: true,
  });
  Object.defineProperty(navigator.serviceWorker, "ready", {
    get: mockReady,
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
  mockReady.mockReset();
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
    mockReady.mockResolvedValue(registration);
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

    let outcome: NotificationPermission | null = null;
    await act(async () => {
      outcome = await result.current.subscribe();
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
    expect(outcome).toBe("granted");
    expect(result.current.isSubscribed).toBe(true);
  });

  it("SHOULD reuse an existing registration instead of registering again", async () => {
    const registration = fakeRegistration();
    mockGetRegistration.mockResolvedValue(registration);
    mockReady.mockResolvedValue(registration);
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

  it('SHOULD update permission, resolve to "denied", and NOT subscribe WHEN permission is denied', async () => {
    mockRequestPermission.mockResolvedValue("denied");
    const registration = fakeRegistration();
    mockGetRegistration.mockResolvedValue(registration);
    mockReady.mockResolvedValue(registration);

    const { result } = renderUsePushSubscription();

    let outcome: NotificationPermission | null = null;
    await act(async () => {
      outcome = await result.current.subscribe();
    });

    await waitFor(() => expect(result.current.permission).toBe("denied"));
    expect(subscribeApi).not.toHaveBeenCalled();
    expect(outcome).toBe("denied");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("SHOULD log an error, resolve to null, and do nothing browser-side WHEN the VAPID key is not set", async () => {
    // Isolated module graph: the empty-key constants mock must not leak.
    vi.resetModules();
    vi.doMock("../../../../../lib/constants", () => ({ VAPID_PUBLIC_KEY: "" }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { usePushSubscription: usePushSubscriptionWithNoKey } =
      await import("../usePushSubscription");
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => usePushSubscriptionWithNoKey(), { wrapper });

    let outcome: NotificationPermission | null = "granted";
    await act(async () => {
      outcome = await result.current.subscribe();
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "[usePushSubscription.subscribe]",
      expect.objectContaining({ message: expect.stringContaining("NEXT_PUBLIC_VAPID_PUBLIC_KEY") }),
    );
    expect(mockRegister).not.toHaveBeenCalled();
    expect(subscribeApi).not.toHaveBeenCalled();
    expect(outcome).toBeNull();
    expect(result.current.isSubscribed).toBe(false);

    vi.doUnmock("../../../../../lib/constants");
  });
});

describe("unsubscribe", () => {
  it("SHOULD unsubscribe browser-side, notify the API, and clear isSubscribed WHEN a subscription exists", async () => {
    const unsubscribeBrowserSide = vi.fn().mockResolvedValue(true);
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue({
      endpoint: "https://push.example/abc",
      unsubscribe: unsubscribeBrowserSide,
    });
    mockGetRegistration.mockResolvedValue(registration);
    unsubscribeApi.mockResolvedValue(undefined);

    const { result } = renderUsePushSubscription();

    // Let the mount-time isSubscribed check settle first.
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(unsubscribeApi).toHaveBeenCalledWith("https://push.example/abc");
    expect(unsubscribeBrowserSide).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });

  it("SHOULD still unsubscribe browser-side and clear isSubscribed WHEN the API call fails", async () => {
    const unsubscribeBrowserSide = vi.fn().mockResolvedValue(true);
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue({
      endpoint: "https://push.example/abc",
      unsubscribe: unsubscribeBrowserSide,
    });
    mockGetRegistration.mockResolvedValue(registration);
    unsubscribeApi.mockRejectedValue(new Error("HTTP error! status: 401"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderUsePushSubscription();
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(unsubscribeBrowserSide).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
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
    expect(result.current.isSubscribed).toBe(false);
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

describe("isSubscribed (on-mount check)", () => {
  it("SHOULD become true WHEN the browser already holds a push subscription on mount", async () => {
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue({
      endpoint: "https://push.example/existing",
    });
    mockGetRegistration.mockResolvedValue(registration);

    const { result } = renderUsePushSubscription();

    expect(result.current.isSubscribed).toBe(false);
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));
    expect(mockGetRegistration).toHaveBeenCalledWith("/sw.js");
  });

  it("SHOULD stay false WHEN there is no existing subscription on mount", async () => {
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue(null);
    mockGetRegistration.mockResolvedValue(registration);

    const { result } = renderUsePushSubscription();

    await waitFor(() => expect(mockGetRegistration).toHaveBeenCalled());
    expect(result.current.isSubscribed).toBe(false);
  });

  it("SHOULD stay false and skip the check entirely WHEN the browser does not support push", () => {
    delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;

    const { result } = renderUsePushSubscription();

    expect(result.current.isSubscribed).toBe(false);
    expect(mockGetRegistration).not.toHaveBeenCalled();
  });
});

// A promise settled by the test, to hold a mutation in flight: the mocks
// resolve on the next microtask, faster than waitFor polls.
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("isPending", () => {
  it("SHOULD be true while a subscribe mutation is in flight and false once it settles", async () => {
    const registration = fakeRegistration();
    mockGetRegistration.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(registration);
    mockReady.mockResolvedValue(registration);
    registration.pushManager.subscribe.mockResolvedValue({
      toJSON: () => ({ endpoint: "https://push.example/abc", keys: { p256dh: "a", auth: "b" } }),
    });
    // Held open on the mutation's last await, so isPending stays true.
    const { promise: apiCall, resolve: resolveApiCall } = deferred<{
      endpoint: string;
      createdAt: string;
    }>();
    subscribeApi.mockReturnValue(apiCall);

    const { result } = renderUsePushSubscription();

    let subscribePromise!: Promise<NotificationPermission | null>;
    act(() => {
      subscribePromise = result.current.subscribe();
    });

    await waitFor(() => expect(subscribeApi).toHaveBeenCalled());
    expect(result.current.isPending).toBe(true);
    expect(result.current.isSubscribing).toBe(true);

    resolveApiCall({ endpoint: "https://push.example/abc", createdAt: "now" });
    await act(async () => {
      await subscribePromise;
    });

    expect(result.current.isPending).toBe(false);
  });

  it("SHOULD be true while an unsubscribe mutation is in flight and false once it settles", async () => {
    const registration = fakeRegistration();
    registration.pushManager.getSubscription.mockResolvedValue({
      endpoint: "https://push.example/abc",
      unsubscribe: vi.fn(),
    });
    mockGetRegistration.mockResolvedValue(registration);

    const { result } = renderUsePushSubscription();
    await waitFor(() => expect(mockGetRegistration).toHaveBeenCalled());

    // Held open, as above.
    const { promise: apiCall, resolve: resolveApiCall } = deferred<void>();
    unsubscribeApi.mockReturnValue(apiCall);

    let unsubscribePromise!: Promise<void>;
    act(() => {
      unsubscribePromise = result.current.unsubscribe();
    });

    await waitFor(() => expect(unsubscribeApi).toHaveBeenCalled());
    expect(result.current.isPending).toBe(true);
    // The subscribe-only flag stays false: isPending is what covers both
    // directions.
    expect(result.current.isSubscribing).toBe(false);

    resolveApiCall();
    await act(async () => {
      await unsubscribePromise;
    });

    expect(result.current.isPending).toBe(false);
  });
});
