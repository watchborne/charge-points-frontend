import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocked via the relative module path, not the "@/lib/api" alias: this
// project's Vitest config does not alias "@/" for the mock resolver (see
// FirmwarePanel.test.tsx's identical note), so an aliased target here would
// silently mock a different module than the one useStatusHistory imports.
vi.mock("../../../../../lib/api", () => ({
  api: {
    StatusHistory: {
      getConnectionEvents: vi.fn().mockResolvedValue([]),
      getConnectorStatusEvents: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { api } from "../../../../../lib/api";
import { HISTORY_FETCH_LIMIT, useStatusHistory } from "../useStatusHistory";

// A fixed instant with a non-midnight local time, so the "day" window's
// start (00:00:00.000) is visibly distinct from `now`.
const NOW = new Date("2026-08-10T14:30:00.000Z");

// Flushes the mocked API promises (pure microtasks) without advancing
// wall-clock time — same pattern as ws-manager.test.ts's `settle`, needed
// because vi.useFakeTimers() would otherwise make Testing Library's own
// `waitFor` polling loop (setTimeout-based) hang forever.
const settle = () => act(() => vi.advanceTimersByTimeAsync(0));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useStatusHistory", () => {
  it("SHOULD anchor the 'day' window to local midnight, not a rolling 24h", async () => {
    const { result } = renderHook(() => useStatusHistory("cp-1", "day", 1));
    await settle();

    expect(result.current.loading).toBe(false);
    expect(result.current.windowStart.getHours()).toBe(0);
    expect(result.current.windowStart.getMinutes()).toBe(0);
    expect(result.current.windowEnd).toEqual(NOW);
  });

  it("SHOULD anchor the '7d' window seven days before now", async () => {
    const { result } = renderHook(() => useStatusHistory("cp-1", "7d", 1));
    await settle();

    expect(result.current.windowStart).toEqual(new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000));
    expect(result.current.windowEnd).toEqual(NOW);
  });

  it("SHOULD anchor the '30d' window thirty days before now", async () => {
    const { result } = renderHook(() => useStatusHistory("cp-1", "30d", 1));
    await settle();

    expect(result.current.windowStart).toEqual(new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000));
  });

  it("SHOULD fetch both streams with until=windowEnd and no since", async () => {
    renderHook(() => useStatusHistory("cp-1", "7d", 2));
    await settle();

    expect(api.StatusHistory.getConnectionEvents).toHaveBeenCalledWith(
      "cp-1",
      expect.objectContaining({ until: NOW, limit: HISTORY_FETCH_LIMIT }),
    );
    expect(api.StatusHistory.getConnectionEvents).toHaveBeenCalledWith(
      "cp-1",
      expect.not.objectContaining({ since: expect.anything() }),
    );
    expect(api.StatusHistory.getConnectorStatusEvents).toHaveBeenCalledWith(
      "cp-1",
      expect.objectContaining({ connectorId: 2, until: NOW, limit: HISTORY_FETCH_LIMIT }),
    );
  });

  it("SHOULD set truncated WHEN either stream returns exactly the fetch limit", async () => {
    vi.mocked(api.StatusHistory.getConnectionEvents).mockResolvedValueOnce(
      Array.from({ length: HISTORY_FETCH_LIMIT }, (_, i) => ({
        id: `${i}`,
        chargePointId: "cp-1",
        status: "SYNCED" as const,
        previousStatus: null,
        occurredAt: NOW.toISOString(),
        createdAt: NOW.toISOString(),
      })),
    );

    const { result } = renderHook(() => useStatusHistory("cp-1", "30d", 1));
    await settle();

    expect(result.current.truncated).toBe(true);
  });

  it("SHOULD NOT be truncated WHEN both streams return fewer rows than the limit", async () => {
    const { result } = renderHook(() => useStatusHistory("cp-1", "30d", 1));
    await settle();

    expect(result.current.truncated).toBe(false);
  });

  it("SHOULD set failed WHEN a request rejects", async () => {
    vi.mocked(api.StatusHistory.getConnectionEvents).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useStatusHistory("cp-1", "day", 1));
    await settle();

    expect(result.current.failed).toBe(true);
  });

  it("SHOULD refetch WHEN the connector changes", async () => {
    const { rerender } = renderHook(
      ({ connectorId }) => useStatusHistory("cp-1", "day", connectorId),
      {
        initialProps: { connectorId: 1 },
      },
    );
    await settle();
    expect(api.StatusHistory.getConnectorStatusEvents).toHaveBeenCalledTimes(1);

    rerender({ connectorId: 2 });
    await settle();

    expect(api.StatusHistory.getConnectorStatusEvents).toHaveBeenCalledTimes(2);
    expect(api.StatusHistory.getConnectorStatusEvents).toHaveBeenLastCalledWith(
      "cp-1",
      expect.objectContaining({ connectorId: 2 }),
    );
  });
});
