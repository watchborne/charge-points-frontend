import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mocked via the relative module path, not the "@/lib/api" alias — this
// project's Vitest config does not alias "@/" for the mock resolver (see
// useStatusHistory.test.ts's identical note).
vi.mock("../../../../../lib/api", () => ({
  api: {
    FleetReliability: {
      getFleetReliability: vi.fn().mockResolvedValue({
        from: "2026-08-01T00:00:00.000Z",
        to: "2026-08-31T00:00:00.000Z",
        previousFrom: "2026-07-02T00:00:00.000Z",
        previousTo: "2026-08-01T00:00:00.000Z",
        chargePoints: [],
      }),
    },
  },
}));

import { api } from "../../../../../lib/api";
import { useFleetReliability } from "../useFleetReliability";

const wrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
};

afterEach(() => vi.clearAllMocks());

describe("useFleetReliability", () => {
  it("SHOULD start in a loading state with no ranking yet", () => {
    const { result } = renderHook(() => useFleetReliability(), { wrapper: wrapper() });

    expect(result.current.loading).toBe(true);
    expect(result.current.reliability).toBeNull();
  });

  it("SHOULD expose the ranking once the fetch resolves", async () => {
    const { result } = renderHook(() => useFleetReliability(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.failed).toBe(false);
    expect(result.current.reliability?.chargePoints).toEqual([]);
    expect(api.FleetReliability.getFleetReliability).toHaveBeenCalledWith();
  });

  it("SHOULD set failed and leave reliability null WHEN the fetch rejects", async () => {
    vi.mocked(api.FleetReliability.getFleetReliability).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useFleetReliability(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.reliability).toBeNull();
  });
});
