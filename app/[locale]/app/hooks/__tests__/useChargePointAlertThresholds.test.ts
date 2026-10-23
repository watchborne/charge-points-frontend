import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../lib/api", () => ({
  api: {
    ChargePointAlertThresholds: {
      get: vi.fn().mockResolvedValue({
        chargePointId: "cp-1",
        thresholds: null,
        effective: {
          values: { offlineAfterMs: 3_600_000 },
          sources: { offlineAfterMs: "default" },
        },
      }),
      update: vi.fn().mockResolvedValue({ chargePointId: "cp-1" }),
      reset: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { api } from "../../../../../lib/api";
import { useChargePointAlertThresholds } from "../useChargePointAlertThresholds";

const wrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
};

afterEach(() => vi.clearAllMocks());

describe("useChargePointAlertThresholds", () => {
  it("SHOULD not fetch WHEN there is no charge point", () => {
    const { result } = renderHook(() => useChargePointAlertThresholds(null), {
      wrapper: wrapper(),
    });

    expect(result.current.thresholds).toBeNull();
    expect(api.ChargePointAlertThresholds.get).not.toHaveBeenCalled();
  });

  it("SHOULD expose the effective thresholds and a null row WHEN the charge point has no override", async () => {
    const { result } = renderHook(() => useChargePointAlertThresholds("cp-1"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.thresholds).toBeNull();
    expect(result.current.effective?.values.offlineAfterMs).toBe(3_600_000);
    expect(api.ChargePointAlertThresholds.get).toHaveBeenCalledWith("cp-1");
  });

  it("SHOULD set error WHEN the fetch rejects", async () => {
    vi.mocked(api.ChargePointAlertThresholds.get).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useChargePointAlertThresholds("cp-1"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));
  });

  it("SHOULD PATCH the charge point and refetch WHEN thresholds are updated", async () => {
    const { result } = renderHook(() => useChargePointAlertThresholds("cp-1"), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.updateThresholds({ offlineAfterMs: 7_200_000 }));

    expect(api.ChargePointAlertThresholds.update).toHaveBeenCalledWith("cp-1", {
      offlineAfterMs: 7_200_000,
    });
    await waitFor(() => expect(api.ChargePointAlertThresholds.get).toHaveBeenCalledTimes(2));
  });

  it("SHOULD DELETE the charge point's overrides and refetch WHEN reset", async () => {
    const { result } = renderHook(() => useChargePointAlertThresholds("cp-1"), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.resetThresholds());

    expect(api.ChargePointAlertThresholds.reset).toHaveBeenCalledWith("cp-1");
    await waitFor(() => expect(api.ChargePointAlertThresholds.get).toHaveBeenCalledTimes(2));
  });
});
