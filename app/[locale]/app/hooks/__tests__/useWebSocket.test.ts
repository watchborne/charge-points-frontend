import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WebSocketStatus } from "../../ws/ws-manager";
import { useWebSocket } from "../useWebSocket";

// The manager singleton itself is covered by app/app/ws/__tests__/ws-manager.test.ts,
// so here getWebSocketManager is mocked to isolate the hook's own wiring: memoizing
// the manager per url, subscribing/unsubscribing, and delegating sendMessage/reconnect.
type Listener = (state: {
  status: WebSocketStatus;
  lastMessage: MessageEvent | null;
  socket: WebSocket | null;
}) => void;

const { getWebSocketManager } = vi.hoisted(() => ({
  getWebSocketManager: vi.fn(),
}));

vi.mock("../../ws/ws-manager", () => ({ getWebSocketManager }));

function createMockManager() {
  let listener: Listener | null = null;
  const unsubscribe = vi.fn();
  const manager = {
    subscribe: vi.fn((l: Listener) => {
      listener = l;
      return unsubscribe;
    }),
    sendMessage: vi.fn(),
    reconnect: vi.fn(),
  };
  const emit = (state: Parameters<Listener>[0]) => listener?.(state);
  return { manager, unsubscribe, emit };
}

beforeEach(() => {
  getWebSocketManager.mockReset();
});

describe("useWebSocket", () => {
  it("SHOULD fetch the manager for the given url WHEN mounted", () => {
    const { manager } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);

    renderHook(() => useWebSocket("ws://test/ws"));

    expect(getWebSocketManager).toHaveBeenCalledWith("ws://test/ws");
  });

  it("SHOULD subscribe to the manager and expose the initial disconnected state", () => {
    const { manager } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);

    const { result } = renderHook(() => useWebSocket("ws://test/ws"));

    expect(manager.subscribe).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("DISCONNECTED");
    expect(result.current.lastMessage).toBeNull();
    expect(result.current.socket).toBeNull();
  });

  it("SHOULD update status, lastMessage, and socket WHEN the manager emits a new state", () => {
    const { manager, emit } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);
    const fakeSocket = {} as WebSocket;
    const fakeMessage = { data: "hello" } as MessageEvent;

    const { result } = renderHook(() => useWebSocket("ws://test/ws"));

    act(() => {
      emit({ status: "CONNECTED", lastMessage: fakeMessage, socket: fakeSocket });
    });

    expect(result.current.status).toBe("CONNECTED");
    expect(result.current.lastMessage).toBe(fakeMessage);
    expect(result.current.socket).toBe(fakeSocket);
  });

  it("SHOULD unsubscribe from the manager WHEN unmounted", () => {
    const { manager, unsubscribe } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);

    const { unmount } = renderHook(() => useWebSocket("ws://test/ws"));
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("SHOULD NOT fetch the manager again WHEN re-rendered with the same url", () => {
    const { manager } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);

    const { rerender } = renderHook(({ url }) => useWebSocket(url), {
      initialProps: { url: "ws://test/ws" },
    });
    rerender({ url: "ws://test/ws" });

    expect(getWebSocketManager).toHaveBeenCalledTimes(1);
  });

  it("SHOULD unsubscribe from the old manager and subscribe to the new one WHEN the url changes", () => {
    const first = createMockManager();
    const second = createMockManager();
    getWebSocketManager.mockReturnValueOnce(first.manager).mockReturnValueOnce(second.manager);

    const { rerender } = renderHook(({ url }) => useWebSocket(url), {
      initialProps: { url: "ws://a/ws" },
    });
    rerender({ url: "ws://b/ws" });

    expect(getWebSocketManager).toHaveBeenNthCalledWith(1, "ws://a/ws");
    expect(getWebSocketManager).toHaveBeenNthCalledWith(2, "ws://b/ws");
    expect(first.unsubscribe).toHaveBeenCalledTimes(1);
    expect(second.manager.subscribe).toHaveBeenCalledTimes(1);
  });

  it("SHOULD delegate sendMessage to the manager", () => {
    const { manager } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);

    const { result } = renderHook(() => useWebSocket("ws://test/ws"));
    result.current.sendMessage("ping");

    expect(manager.sendMessage).toHaveBeenCalledWith("ping");
  });

  it("SHOULD delegate reconnect to the manager", () => {
    const { manager } = createMockManager();
    getWebSocketManager.mockReturnValue(manager);

    const { result } = renderHook(() => useWebSocket("ws://test/ws"));
    result.current.reconnect();

    expect(manager.reconnect).toHaveBeenCalledTimes(1);
  });
});
