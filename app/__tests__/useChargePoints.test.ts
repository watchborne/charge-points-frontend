import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createChargePoint } from "./fixtures/charge-point";
import { api } from "../../lib/api";
import { useChargePoints } from "../app/hooks/useChargePoints";
import { useWebSocketContext } from "../app/hooks/useWebSocketContext";

// Mock the api module
vi.mock("../../lib/api", () => ({
  api: {
    ChargePoints: {
      getChargePoints: vi.fn(),
    },
    Sites: {
      getSites: vi.fn(),
    },
  },
}));

// Mock useWebSocketContext
vi.mock("../app/hooks/useWebSocketContext", () => ({
  useWebSocketContext: vi.fn(() => ({
    lastMessage: null,
    messages: [],
    status: "DISCONNECTED",
    sendMessage: vi.fn(),
    reconnect: vi.fn(),
    clearMessages: vi.fn(),
  })),
}));

const mockGetChargePoints = vi.mocked(api.ChargePoints.getChargePoints);
const mockUseWebSocketContext = vi.mocked(useWebSocketContext);

const mockChargePoints = [
  createChargePoint({
    id: "cp-1",
    name: "Borne A",
    isActive: true,
    siteId: "site-1",
    connection: { status: "CONNECTED", lastSeenAt: new Date() },
  }),
  createChargePoint({
    id: "cp-2",
    name: "Borne B",
    isActive: false,
    siteId: "site-1",
    connection: { status: "OFFLINE", lastSeenAt: null },
  }),
];

describe("useChargePoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: null,
      messages: [],
      status: "DISCONNECTED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });
  });

  it("SHOULD load charge points WHEN mounted", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.chargePoints).toEqual(mockChargePoints);
    expect(result.current.error).toBeNull();
    expect(mockGetChargePoints).toHaveBeenCalledTimes(1);
  });

  it("SHOULD be in a loading state WHILE fetching", async () => {
    let resolvePromise!: (value: typeof mockChargePoints) => void;
    const pendingPromise = new Promise<typeof mockChargePoints>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetChargePoints.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useChargePoints());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise(mockChargePoints);
      await pendingPromise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("SHOULD expose an error WHEN the API call fails", async () => {
    mockGetChargePoints.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("Impossible de charger les bornes");
    expect(result.current.chargePoints).toEqual([]);
  });

  it("SHOULD reload the data WHEN refetch is called", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetChargePoints).toHaveBeenCalledTimes(1);

    const newChargePoints = [
      createChargePoint({
        id: "cp-3",
        name: "Borne C",
        isActive: true,
        siteId: "site-2",
        connection: { status: "SYNCED", lastSeenAt: new Date() },
      }),
    ];
    mockGetChargePoints.mockResolvedValue(newChargePoints);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetChargePoints).toHaveBeenCalledTimes(2);
    expect(result.current.chargePoints).toEqual(newChargePoints);
  });

  it("SHOULD update a charge point in place WHEN a CHARGE_POINT_MONITORING WebSocket message arrives", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result, rerender } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockGetChargePoints.mock.calls.length;

    const updatedChargePoint = {
      id: "cp-1",
      name: "Borne A Updated",
      isActive: true,
      siteId: "site-1",
      connection: { status: "OFFLINE" as const },
    };

    // Simulate a CHARGE_POINT_MONITORING WebSocket message with payload
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: {
        type: "CHARGE_POINT_MONITORING",
        payload: { chargePoint: updatedChargePoint },
        timestamp: Date.now().toString(),
      },
      messages: [],
      status: "CONNECTED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.chargePoints[0]).toEqual(updatedChargePoint);
    });

    // Local update only, no new API call
    expect(mockGetChargePoints.mock.calls.length).toBe(initialCallCount);
  });

  it("SHOULD refetch charge points WHEN the WebSocket reconnects after a drop", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: null,
      messages: [],
      status: "CONNECTED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });

    const { rerender } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(mockGetChargePoints).toHaveBeenCalledTimes(1);
    });

    // A plain drop must not trigger a refetch
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: null,
      messages: [],
      status: "DISCONNECTED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });
    rerender();
    expect(mockGetChargePoints).toHaveBeenCalledTimes(1);

    // Reconnecting must resync data via a REST refetch
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: null,
      messages: [],
      status: "CONNECTED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });
    rerender();

    await waitFor(() => {
      expect(mockGetChargePoints).toHaveBeenCalledTimes(2);
    });
  });
});
