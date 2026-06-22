import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChargePoints } from "../app/hooks/useChargePoints";

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
    status: "CLOSED",
    sendMessage: vi.fn(),
    reconnect: vi.fn(),
    clearMessages: vi.fn(),
  })),
}));

import { api } from "../../lib/api";
import { useWebSocketContext } from "../app/hooks/useWebSocketContext";

const mockGetChargePoints = vi.mocked(api.ChargePoints.getChargePoints);
const mockUseWebSocketContext = vi.mocked(useWebSocketContext);

const mockChargePoints = [
  {
    uuid: "cp-1",
    name: "Borne A",
    isActive: true,
    siteId: "site-1",
    connection: { status: "CONNECTED" as const },
  },
  {
    uuid: "cp-2",
    name: "Borne B",
    isActive: false,
    siteId: "site-1",
    connection: { status: "OFFLINE" as const },
  },
];

describe("useChargePoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: null,
      messages: [],
      status: "CLOSED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });
  });

  it("charge les charge points au montage", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.chargePoints).toEqual(mockChargePoints);
    expect(result.current.error).toBeNull();
    expect(mockGetChargePoints).toHaveBeenCalledTimes(1);
  });

  it("est en état loading pendant le fetch", async () => {
    let resolvePromise!: (value: typeof mockChargePoints) => void;
    const pendingPromise = new Promise<typeof mockChargePoints>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetChargePoints.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useChargePoints());

    // Initialement en loading
    expect(result.current.loading).toBe(true);

    // Résoudre la promesse
    await act(async () => {
      resolvePromise(mockChargePoints);
      await pendingPromise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("gère les erreurs si l'API échoue", async () => {
    mockGetChargePoints.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("Impossible de charger les bornes");
    expect(result.current.chargePoints).toEqual([]);
  });

  it("refetch recharge les données", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetChargePoints).toHaveBeenCalledTimes(1);

    const newChargePoints = [
      {
        uuid: "cp-3",
        name: "Borne C",
        isActive: true,
        siteId: "site-2",
        connection: { status: "SYNCED" as const },
      },
    ];
    mockGetChargePoints.mockResolvedValue(newChargePoints);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetChargePoints).toHaveBeenCalledTimes(2);
    expect(result.current.chargePoints).toEqual(newChargePoints);
  });

  it("recharge les données lors d'un message WebSocket CHARGE_POINT_MONITORING", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result, rerender } = renderHook(() => useChargePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockGetChargePoints.mock.calls.length;

    // Simuler un message WebSocket CHARGE_POINT_MONITORING
    mockUseWebSocketContext.mockReturnValue({
      lastMessage: {
        type: "CHARGE_POINT_MONITORING",
        data: {},
        timestamp: Date.now(),
      },
      messages: [],
      status: "CONNECTED",
      sendMessage: vi.fn(),
      reconnect: vi.fn(),
      clearMessages: vi.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(mockGetChargePoints.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
    });
  });
});
