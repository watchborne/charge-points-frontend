import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createChargePoint } from "./fixtures/charge-point";
import { api } from "../../lib/api";
import { useChargePoints } from "../[locale]/app/hooks/useChargePoints";
import { useWebSocketContext } from "../[locale]/app/hooks/useWebSocketContext";

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
vi.mock("../[locale]/app/hooks/useWebSocketContext", () => ({
  useWebSocketContext: vi.fn(() => ({
    lastMessage: null,
    messages: [],
    status: "DISCONNECTED",
    sendMessage: vi.fn(),
    reconnect: vi.fn(),
    clearMessages: vi.fn(),
  })),
}));

const mockPushWarningNotification = vi.fn();
vi.mock("../../app/components/ToastNotification", () => ({
  useToastNotification: vi.fn(() => ({
    pushNotification: vi.fn(),
    pushSuccessNotification: vi.fn(),
    pushErrorNotification: vi.fn(),
    pushWarningNotification: mockPushWarningNotification,
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

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function renderUseChargePoints() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useChargePoints(), { wrapper });
}

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

    const { result } = renderUseChargePoints();

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

    const { result } = renderUseChargePoints();

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

    const { result } = renderUseChargePoints();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("errors.loadingChargePoints");
    expect(result.current.chargePoints).toEqual([]);
  });

  it("SHOULD reload the data WHEN refetch is called", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result } = renderUseChargePoints();

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
    await waitFor(() => {
      expect(result.current.chargePoints).toEqual(newChargePoints);
    });
  });

  it("SHOULD update a charge point in place WHEN a CHARGE_POINT_MONITORING WebSocket message arrives", async () => {
    mockGetChargePoints.mockResolvedValue(mockChargePoints);

    const { result, rerender } = renderUseChargePoints();

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

    const { rerender } = renderUseChargePoints();

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

  it("SHOULD push a warning toast WHEN a connector status transition is unexpected", async () => {
    const chargePointWithConnector = createChargePoint({
      id: "cp-1",
      name: "Borne A",
      connection: { status: "SYNCED", lastSeenAt: new Date() },
      connectors: [
        {
          id: "connector-1",
          chargePointId: "cp-1",
          connectorId: 1,
          status: "Faulted",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    });
    mockGetChargePoints.mockResolvedValue([chargePointWithConnector]);

    const { result, rerender } = renderUseChargePoints();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockUseWebSocketContext.mockReturnValue({
      lastMessage: {
        type: "CHARGE_POINT_MONITORING",
        payload: {
          chargePoint: {
            ...chargePointWithConnector,
            connectors: [{ ...chargePointWithConnector.connectors[0], status: "Charging" }],
          },
        },
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
      expect(result.current.chargePoints[0].connectors[0].status).toBe("Charging");
    });

    expect(mockPushWarningNotification).toHaveBeenCalledTimes(1);
  });

  it("SHOULD NOT push a warning toast WHEN a connector status transition is expected", async () => {
    const chargePointWithConnector = createChargePoint({
      id: "cp-1",
      name: "Borne A",
      connection: { status: "SYNCED", lastSeenAt: new Date() },
      connectors: [
        {
          id: "connector-1",
          chargePointId: "cp-1",
          connectorId: 1,
          status: "Available",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    });
    mockGetChargePoints.mockResolvedValue([chargePointWithConnector]);

    const { result, rerender } = renderUseChargePoints();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockUseWebSocketContext.mockReturnValue({
      lastMessage: {
        type: "CHARGE_POINT_MONITORING",
        payload: {
          chargePoint: {
            ...chargePointWithConnector,
            connectors: [{ ...chargePointWithConnector.connectors[0], status: "Preparing" }],
          },
        },
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
      expect(result.current.chargePoints[0].connectors[0].status).toBe("Preparing");
    });

    expect(mockPushWarningNotification).not.toHaveBeenCalled();
  });
});
