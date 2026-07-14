import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSite } from "./fixtures/site";
import { api } from "../../lib/api";
import { useSites } from "../app/hooks/useSites";

vi.mock("../../lib/api", () => ({
  api: {
    Sites: {
      getSites: vi.fn(),
    },
  },
}));

const mockGetSites = vi.mocked(api.Sites.getSites);

const mockSites = [
  createSite({ id: "site-1", name: "Site Paris", customer: "customer-1" }),
  createSite({ id: "site-2", name: "Site Lyon", customer: "customer-2" }),
];

describe("useSites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SHOULD load sites WHEN mounted", async () => {
    mockGetSites.mockResolvedValue(mockSites);

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sites).toEqual(mockSites);
    expect(result.current.error).toBeNull();
    expect(mockGetSites).toHaveBeenCalled();
  });

  it("SHOULD be in a loading state WHILE fetching", async () => {
    let resolvePromise!: (value: typeof mockSites) => void;
    const pendingPromise = new Promise<typeof mockSites>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetSites.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useSites());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.sites).toEqual([]);

    // Resolve the promise
    await act(async () => {
      resolvePromise(mockSites);
      await pendingPromise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("SHOULD expose an error WHEN the API call fails", async () => {
    mockGetSites.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("Impossible de charger les sites");
    expect(result.current.sites).toEqual([]);
  });

  it("SHOULD reload the data WHEN refetch is called", async () => {
    mockGetSites.mockResolvedValue(mockSites);

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterMount = mockGetSites.mock.calls.length;

    const newSites = [createSite({ id: "site-3", name: "Site Marseille", customer: "customer-3" })];
    mockGetSites.mockResolvedValue(newSites);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetSites.mock.calls.length).toBeGreaterThan(callCountAfterMount);
    expect(result.current.sites).toEqual(newSites);
  });

  it("SHOULD clear the error WHEN a refetch succeeds", async () => {
    mockGetSites.mockRejectedValue(new Error("Erreur réseau"));

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();

    // Refetch succeeds
    mockGetSites.mockResolvedValue(mockSites);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.sites).toEqual(mockSites);
  });
});
