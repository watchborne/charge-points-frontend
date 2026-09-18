import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChargePointWithConnectors } from "@/types/charge-point";

// Mocked via the relative module path, not the "@/lib/api" alias — this
// project's Vitest config does not alias "@/" for the mock resolver (see
// useFleetReliability.test.ts's identical note).
vi.mock("../../../../../lib/api", () => ({
  api: {
    Uptime: {
      getSiteUptime: vi.fn().mockResolvedValue({
        siteId: "site-1",
        from: "2026-08-01T00:00:00.000Z",
        to: "2026-08-08T00:00:00.000Z",
        onlineMs: 500_000,
        totalMs: 600_000,
        lastActivity: "2026-08-07T12:00:00.000Z",
        chargePoints: [],
      }),
    },
    Metering: {
      getConsumption: vi.fn().mockResolvedValue({
        chargePointId: "cp-1",
        from: "2026-08-01T00:00:00.000Z",
        to: "2026-08-08T00:00:00.000Z",
        series: [],
      }),
    },
    ChargePoints: {
      getAlerts: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { api } from "../../../../../lib/api";
import { useSiteReport } from "../useSiteReport";

const SITE = { id: "site-1", name: "Test site" } as unknown as Site;

const buildChargePoint = (id: string, name: string) =>
  ({ id, name, siteId: SITE.id }) as unknown as ChargePointWithConnectors;

const wrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
};

afterEach(() => vi.clearAllMocks());

describe("useSiteReport", () => {
  it("SHOULD start in a loading state with no report yet", () => {
    const { result } = renderHook(() => useSiteReport(SITE, [buildChargePoint("cp-1", "CP 1")]), {
      wrapper: wrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.report).toBeNull();
  });

  it("SHOULD assemble uptime and per-charge-point consumption/alerts WHEN the fetches resolve", async () => {
    vi.mocked(api.ChargePoints.getAlerts).mockResolvedValueOnce([
      {
        id: "alert-1",
        chargePointId: "cp-1",
        connectorId: null,
        type: "OFFLINE",
        status: "RESOLVED",
        // Inside the uptime-echoed window (2026-08-01..2026-08-08).
        openedAt: "2026-08-03T00:00:00.000Z",
        resolvedAt: "2026-08-03T01:00:00.000Z",
        acknowledgedAt: null,
        acknowledgedBy: null,
        lastNotifiedAt: null,
        notificationCount: 0,
        notifiedRecipients: [],
        createdAt: "2026-08-03T00:00:00.000Z",
        updatedAt: "2026-08-03T01:00:00.000Z",
      },
      {
        id: "alert-2",
        chargePointId: "cp-1",
        connectorId: null,
        type: "OFFLINE",
        status: "RESOLVED",
        // Before the window — must be filtered out.
        openedAt: "2026-07-01T00:00:00.000Z",
        resolvedAt: "2026-07-01T01:00:00.000Z",
        acknowledgedAt: null,
        acknowledgedBy: null,
        lastNotifiedAt: null,
        notificationCount: 0,
        notifiedRecipients: [],
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T01:00:00.000Z",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const { result } = renderHook(() => useSiteReport(SITE, [buildChargePoint("cp-1", "CP 1")]), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.failed).toBe(false);
    expect(result.current.report?.siteId).toBe("site-1");
    expect(result.current.report?.uptime.onlineMs).toBe(500_000);
    expect(result.current.report?.chargePoints).toHaveLength(1);
    expect(result.current.report?.chargePoints[0]).toMatchObject({
      chargePointId: "cp-1",
      name: "CP 1",
    });
    expect(result.current.report?.chargePoints[0].alerts.map((alert) => alert.id)).toEqual([
      "alert-1",
    ]);
  });

  it("SHOULD return an empty per-charge-point list WHEN the site has no charge points", async () => {
    const { result } = renderHook(() => useSiteReport(SITE, []), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.report?.chargePoints).toEqual([]);
    expect(api.Metering.getConsumption).not.toHaveBeenCalled();
  });

  it("SHOULD set failed and leave report null WHEN a fetch rejects", async () => {
    vi.mocked(api.Uptime.getSiteUptime).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useSiteReport(SITE, [buildChargePoint("cp-1", "CP 1")]), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.report).toBeNull();
  });
});
