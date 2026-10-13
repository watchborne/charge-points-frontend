import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mocked via the relative module path, not the "@/lib/api" alias (see
// useFleetReliability.test.ts's identical note).
vi.mock("../../../../../lib/api", () => ({
  api: {
    SiteAlertThresholds: {
      get: vi.fn().mockResolvedValue({
        siteId: "site-1",
        thresholds: null,
        effective: {
          values: { offlineAfterMs: 3_600_000 },
          sources: { offlineAfterMs: "default" },
        },
      }),
      update: vi.fn().mockResolvedValue({ siteId: "site-1" }),
      reset: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { api } from "../../../../../lib/api";
import { useSiteAlertThresholds } from "../useSiteAlertThresholds";

const wrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
};

afterEach(() => vi.clearAllMocks());

describe("useSiteAlertThresholds", () => {
  it("SHOULD not fetch WHEN there is no site", () => {
    const { result } = renderHook(() => useSiteAlertThresholds(null), { wrapper: wrapper() });

    expect(result.current.thresholds).toBeNull();
    expect(api.SiteAlertThresholds.get).not.toHaveBeenCalled();
  });

  it("SHOULD expose the effective thresholds and a null row WHEN the site has no override", async () => {
    const { result } = renderHook(() => useSiteAlertThresholds("site-1"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.thresholds).toBeNull();
    expect(result.current.effective?.values.offlineAfterMs).toBe(3_600_000);
    expect(api.SiteAlertThresholds.get).toHaveBeenCalledWith("site-1");
  });

  it("SHOULD set error WHEN the fetch rejects", async () => {
    vi.mocked(api.SiteAlertThresholds.get).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useSiteAlertThresholds("site-1"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));
  });

  it("SHOULD PATCH the site and refetch WHEN thresholds are updated", async () => {
    const { result } = renderHook(() => useSiteAlertThresholds("site-1"), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.updateThresholds({ offlineAfterMs: 7_200_000 }));

    expect(api.SiteAlertThresholds.update).toHaveBeenCalledWith("site-1", {
      offlineAfterMs: 7_200_000,
    });
    await waitFor(() => expect(api.SiteAlertThresholds.get).toHaveBeenCalledTimes(2));
  });

  it("SHOULD refetch the charge points' thresholds too WHEN the site is updated", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSiteAlertThresholds("site-1"), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.updateThresholds({ offlineAfterMs: 7_200_000 }));

    // A station without its own override inherits what the site just changed.
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["chargePointAlertThresholds"] }),
    );
  });

  it("SHOULD DELETE the site's overrides and refetch WHEN reset", async () => {
    const { result } = renderHook(() => useSiteAlertThresholds("site-1"), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.resetThresholds());

    expect(api.SiteAlertThresholds.reset).toHaveBeenCalledWith("site-1");
    await waitFor(() => expect(api.SiteAlertThresholds.get).toHaveBeenCalledTimes(2));
  });
});
