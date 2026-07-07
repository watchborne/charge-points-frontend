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
    connection: { status: "CONNECTED", lastSeen: new Date() },
    status: "Available",
  }),
  createChargePoint({
    id: "cp-2",
    name: "Borne B",
    isActive: false,
    siteId: "site-1",
    connection: { status: "OFFLINE", lastSeen: null },
    status: null,
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
      createChargePoint({
        id: "cp-3",
        name: "Borne C",
        isActive: true,
        siteId: "site-2",
        connection: { status: "SYNCED", lastSeen: new Date() },
        status: "Available",
      }),
    ];
    mockGetChargePoints.mockResolvedValue(newChargePoints);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetChargePoints).toHaveBeenCalledTimes(2);
    expect(result.current.chargePoints).toEqual(newChargePoints);
  });

  it("met à jour un charge point en place lors d'un message WebSocket CHARGE_POINT_MONITORING", async () => {
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

    // Simuler un message WebSocket CHARGE_POINT_MONITORING avec payload
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

    // Mise à jour locale uniquement, pas de nouvel appel API
    expect(mockGetChargePoints.mock.calls.length).toBe(initialCallCount);
  });
});
