import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSiteHealth } from "./fixtures/site-health";
import { api } from "../../lib/api";
import { useSitesHealth } from "../[locale]/app/hooks/useSitesHealth";

vi.mock("../../lib/api", () => ({
  api: {
    Sites: {
      getSitesHealth: vi.fn(),
    },
  },
}));

const mockGetSitesHealth = vi.mocked(api.Sites.getSitesHealth);

const mockSitesHealth = [
  createSiteHealth({ siteId: "site-1", status: "HEALTHY" }),
  createSiteHealth({ siteId: "site-2", status: "CRITICAL" }),
];

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("useSitesHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SHOULD load sites health WHEN mounted", async () => {
    mockGetSitesHealth.mockResolvedValue(mockSitesHealth);

    const { result } = renderHook(() => useSitesHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sitesHealth).toEqual(mockSitesHealth);
    expect(result.current.error).toBeNull();
    expect(mockGetSitesHealth).toHaveBeenCalled();
  });

  it("SHOULD be in a loading state WHILE fetching", async () => {
    let resolvePromise!: (value: typeof mockSitesHealth) => void;
    const pendingPromise = new Promise<typeof mockSitesHealth>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetSitesHealth.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useSitesHealth());

    expect(result.current.loading).toBe(true);
    expect(result.current.sitesHealth).toEqual([]);

    await act(async () => {
      resolvePromise(mockSitesHealth);
      await pendingPromise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("SHOULD expose an error WHEN the API call fails", async () => {
    mockGetSitesHealth.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSitesHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("errors.loadingSitesHealth");
    expect(result.current.sitesHealth).toEqual([]);
  });

  it("SHOULD reload the data WHEN refetch is called", async () => {
    mockGetSitesHealth.mockResolvedValue(mockSitesHealth);

    const { result } = renderHook(() => useSitesHealth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountAfterMount = mockGetSitesHealth.mock.calls.length;

    const refetched = [createSiteHealth({ siteId: "site-3", status: "DEGRADED" })];
    mockGetSitesHealth.mockResolvedValue(refetched);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetSitesHealth.mock.calls.length).toBeGreaterThan(callCountAfterMount);
    expect(result.current.sitesHealth).toEqual(refetched);
  });
});
