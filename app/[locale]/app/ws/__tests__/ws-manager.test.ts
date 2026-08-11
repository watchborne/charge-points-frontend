import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The WebSocketManager class is not exported, so it is exercised through the
// public getWebSocketManager() factory. The module keeps a per-URL registry, so
// vi.resetModules() (in beforeEach) hands each test a fresh registry. The global
// WebSocket and fetch (used to mint the token) are stubbed, and timers are faked
// so the 300ms disconnect grace period and the exponential reconnect backoff can
// be advanced deterministically.

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  // Test-side simulation of the server end of the socket.
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }

  simulateServerClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  }

  simulateError() {
    this.onerror?.(new Event("error"));
  }
}

let mockFetch: ReturnType<typeof vi.fn>;

function tokenOk(token = "tok-123") {
  return { ok: true, json: async () => ({ token }) };
}

// Flush the async token fetch (pure microtasks) without advancing wall-clock time.
const settle = () => vi.advanceTimersByTimeAsync(0);

function lastSocket() {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

async function importManager() {
  const { getWebSocketManager } = await import("../ws-manager");
  return getWebSocketManager;
}

// Subscribe, resolve the token, and drive the socket to CONNECTED.
async function connected(url = "ws://test/ws") {
  const getWebSocketManager = await importManager();
  const manager = getWebSocketManager(url);
  const states: string[] = [];
  const unsubscribe = manager.subscribe((s) => states.push(s.status));
  await settle();
  lastSocket().simulateOpen();
  return { manager, states, unsubscribe };
}

beforeEach(() => {
  vi.useFakeTimers();
  MockWebSocket.instances = [];
  mockFetch = vi.fn().mockResolvedValue(tokenOk());
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getWebSocketManager", () => {
  it("SHOULD return the same instance WHEN called twice with the same url", async () => {
    const getWebSocketManager = await importManager();

    expect(getWebSocketManager("ws://a/ws")).toBe(getWebSocketManager("ws://a/ws"));
  });

  it("SHOULD return distinct instances WHEN the urls differ", async () => {
    const getWebSocketManager = await importManager();

    expect(getWebSocketManager("ws://a/ws")).not.toBe(getWebSocketManager("ws://b/ws"));
  });
});

describe("WebSocketManager connection", () => {
  it("SHOULD transition CONNECTING then CONNECTED WHEN a consumer subscribes", async () => {
    const { manager, states } = await connected();

    expect(states).toEqual(["DISCONNECTED", "CONNECTING", "CONNECTED"]);
    expect(manager.getState().status).toBe("CONNECTED");
  });

  it("SHOULD mint a token via the ws-token endpoint and pass it in the socket url", async () => {
    await connected("ws://test/ws");

    expect(mockFetch).toHaveBeenCalledWith("/api/ws-token", { method: "GET" });
    expect(lastSocket().url).toBe("ws://test/ws?token=tok-123");
  });

  it("SHOULD url-encode the token in the socket url", async () => {
    mockFetch.mockResolvedValue(tokenOk("a b/c"));

    await connected("ws://test/ws");

    expect(lastSocket().url).toBe("ws://test/ws?token=a%20b%2Fc");
  });

  it("SHOULD expose the received message as lastMessage WHEN the socket emits", async () => {
    const { manager } = await connected();

    lastSocket().simulateMessage("hello");

    expect(manager.getState().lastMessage?.data).toBe("hello");
  });

  it("SHOULD go to ERROR WHEN the socket errors", async () => {
    const { manager } = await connected();

    lastSocket().simulateError();

    expect(manager.getState().status).toBe("ERROR");
  });
});

describe("WebSocketManager token failure and backoff", () => {
  it("SHOULD go to ERROR WHEN the token endpoint returns a non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const getWebSocketManager = await importManager();
    const manager = getWebSocketManager("ws://test/ws");

    manager.subscribe(() => {});
    await settle();

    expect(manager.getState().status).toBe("ERROR");
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("SHOULD retry with exponential backoff (1s then 2s) WHEN the token keeps failing", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const getWebSocketManager = await importManager();
    const manager = getWebSocketManager("ws://test/ws");

    manager.subscribe(() => {});
    await settle();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // First backoff is 1000ms (1000 * 2^0).
    await vi.advanceTimersByTimeAsync(999);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Second backoff doubles to 2000ms (1000 * 2^1).
    await vi.advanceTimersByTimeAsync(1999);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("SHOULD auto-reconnect WHEN an open socket is closed by the server", async () => {
    const { manager } = await connected();
    expect(MockWebSocket.instances).toHaveLength(1);

    lastSocket().simulateServerClose();
    expect(manager.getState().status).toBe("DISCONNECTED");

    // scheduleReconnect fires after the 1s backoff and opens a fresh socket.
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);

    lastSocket().simulateOpen();
    expect(manager.getState().status).toBe("CONNECTED");
  });
});

describe("WebSocketManager disconnect grace period", () => {
  it("SHOULD close the socket after the 300ms grace period WHEN the last consumer unsubscribes", async () => {
    const { manager, unsubscribe } = await connected();
    const socket = lastSocket();

    unsubscribe();
    // Still open during the grace window.
    await vi.advanceTimersByTimeAsync(299);
    expect(socket.close).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(manager.getState().status).toBe("DISCONNECTED");
  });

  it("SHOULD keep the socket open WHEN a new consumer subscribes within the grace period", async () => {
    const { manager, unsubscribe } = await connected();
    const socket = lastSocket();

    unsubscribe();
    await vi.advanceTimersByTimeAsync(200);

    manager.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(300);

    expect(socket.close).not.toHaveBeenCalled();
    expect(manager.getState().status).toBe("CONNECTED");
  });
});

describe("WebSocketManager reconnect()", () => {
  it("SHOULD close the current socket and open a new one after the delay", async () => {
    const { manager } = await connected();
    const firstSocket = lastSocket();

    manager.reconnect(1000);
    expect(firstSocket.close).toHaveBeenCalled();
    expect(manager.getState().status).toBe("DISCONNECTED");

    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(lastSocket()).not.toBe(firstSocket);
  });
});

describe("WebSocketManager sendMessage", () => {
  it("SHOULD send a string payload as-is WHEN the socket is open", async () => {
    const { manager } = await connected();

    manager.sendMessage("ping");

    expect(lastSocket().send).toHaveBeenCalledWith("ping");
  });

  it("SHOULD JSON-stringify an object payload WHEN the socket is open", async () => {
    const { manager } = await connected();

    manager.sendMessage({ type: "PING" });

    expect(lastSocket().send).toHaveBeenCalledWith(JSON.stringify({ type: "PING" }));
  });

  it("SHOULD warn and not send WHEN the socket is not open", async () => {
    const getWebSocketManager = await importManager();
    const manager = getWebSocketManager("ws://test/ws");

    manager.sendMessage("ping");

    expect(console.warn).toHaveBeenCalled();
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});
