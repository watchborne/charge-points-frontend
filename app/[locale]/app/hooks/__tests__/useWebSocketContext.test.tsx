import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseWebSocketReturn } from "../useWebSocket";
import {
  useWebSocketContext,
  useWebSocketData,
  WebSocketDataProvider,
  type WebSocketMessage,
} from "../useWebSocketContext";

// The underlying connection (useWebSocket / ws-manager) is covered by its own test
// files, so it is mocked here to isolate useWebSocketData's own logic: gating on
// `enabled`, parsing incoming messages, capping history, and clearMessages.
const { useWebSocket } = vi.hoisted(() => ({ useWebSocket: vi.fn() }));

vi.mock("../useWebSocket", () => ({ useWebSocket }));

function baseReturn(overrides: Partial<UseWebSocketReturn> = {}): UseWebSocketReturn {
  return {
    socket: null,
    status: "DISCONNECTED",
    lastMessage: null,
    sendMessage: vi.fn(),
    reconnect: vi.fn(),
    ...overrides,
  };
}

function messageEvent(payload: unknown): MessageEvent {
  return { data: JSON.stringify(payload) } as MessageEvent;
}

const pongMessage = (extra: Record<string, unknown> = {}) =>
  ({ type: "PONG", payload: extra, timestamp: "1" }) satisfies WebSocketMessage;

beforeEach(() => {
  useWebSocket.mockReset();
  useWebSocket.mockReturnValue(baseReturn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useWebSocketData", () => {
  it("SHOULD start with no messages and a null lastMessage", () => {
    const { result } = renderHook(() => useWebSocketData({ url: "ws://test/ws" }));

    expect(result.current.messages).toEqual([]);
    expect(result.current.lastMessage).toBeNull();
  });

  it("SHOULD call useWebSocket with the given url WHEN enabled", () => {
    renderHook(() => useWebSocketData({ url: "ws://test/ws", enabled: true }));

    expect(useWebSocket).toHaveBeenCalledWith("ws://test/ws");
  });

  it("SHOULD call useWebSocket with an empty url WHEN disabled", () => {
    renderHook(() => useWebSocketData({ url: "ws://test/ws", enabled: false }));

    expect(useWebSocket).toHaveBeenCalledWith("");
  });

  it("SHOULD parse and append the raw message WHEN a new one arrives", () => {
    const payload = pongMessage();
    const { result, rerender } = renderHook(() => useWebSocketData({ url: "ws://test/ws" }));

    useWebSocket.mockReturnValue(baseReturn({ lastMessage: messageEvent(payload) }));
    rerender();

    expect(result.current.lastMessage).toEqual(payload);
    expect(result.current.messages).toEqual([payload]);
  });

  it("SHOULD log an error and leave messages unchanged WHEN the raw message is not valid JSON", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, rerender } = renderHook(() => useWebSocketData({ url: "ws://test/ws" }));

    useWebSocket.mockReturnValue(baseReturn({ lastMessage: { data: "not-json" } as MessageEvent }));
    rerender();

    expect(result.current.messages).toEqual([]);
    expect(result.current.lastMessage).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });

  it("SHOULD ignore an incoming message WHEN disabled", () => {
    const payload = pongMessage();
    const { result, rerender } = renderHook(() =>
      useWebSocketData({ url: "ws://test/ws", enabled: false }),
    );

    useWebSocket.mockReturnValue(baseReturn({ lastMessage: messageEvent(payload) }));
    rerender();

    expect(result.current.messages).toEqual([]);
    expect(result.current.lastMessage).toBeNull();
  });

  it("SHOULD cap the message history at 50 entries", () => {
    const { result, rerender } = renderHook(() => useWebSocketData({ url: "ws://test/ws" }));

    for (let i = 0; i < 55; i++) {
      useWebSocket.mockReturnValue(baseReturn({ lastMessage: messageEvent(pongMessage({ i })) }));
      rerender();
    }

    expect(result.current.messages).toHaveLength(50);
    expect(result.current.messages[0].payload).toEqual({ i: 5 });
    expect(result.current.messages[49].payload).toEqual({ i: 54 });
  });

  it("SHOULD clear messages and lastMessage WHEN clearMessages is called", () => {
    const payload = pongMessage();
    const { result, rerender } = renderHook(() => useWebSocketData({ url: "ws://test/ws" }));

    useWebSocket.mockReturnValue(baseReturn({ lastMessage: messageEvent(payload) }));
    rerender();
    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.lastMessage).toBeNull();
  });

  it("SHOULD pass through status, sendMessage, and reconnect from the underlying hook", () => {
    const sendMessage = vi.fn();
    const reconnect = vi.fn();
    useWebSocket.mockReturnValue(baseReturn({ status: "CONNECTED", sendMessage, reconnect }));

    const { result } = renderHook(() => useWebSocketData({ url: "ws://test/ws" }));
    result.current.sendMessage("ping");
    result.current.reconnect();

    expect(result.current.status).toBe("CONNECTED");
    expect(sendMessage).toHaveBeenCalledWith("ping");
    expect(reconnect).toHaveBeenCalledTimes(1);
  });
});

describe("WebSocketDataProvider / useWebSocketContext", () => {
  it("SHOULD provide the useWebSocketData value to consumers", () => {
    useWebSocket.mockReturnValue(baseReturn({ status: "CONNECTED" }));
    const wrapper = ({ children }: PropsWithChildren) => (
      <WebSocketDataProvider url="ws://test/ws">{children}</WebSocketDataProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    expect(result.current.status).toBe("CONNECTED");
  });

  it("SHOULD throw WHEN used outside a WebSocketDataProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useWebSocketContext())).toThrow(
      "useWebSocketContext must be used within a WebSocketDataProvider",
    );
  });
});
