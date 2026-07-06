import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSite } from "@/__tests__/factories";

import { api } from "../../lib/api";
import { useSites } from "../app/hooks/useSites";

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

const mockGetSites = vi.mocked(api.Sites.getSites);

const mockSites = [
  createSite({ id: "site-1", name: "Site Paris", customer: "customer-1" }),
  createSite({ id: "site-2", name: "Site Lyon", customer: "customer-2" }),
];

describe("useSites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("charge les sites au montage", async () => {
    mockGetSites.mockResolvedValue(mockSites);

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sites).toEqual(mockSites);
    expect(result.current.error).toBeNull();
    expect(mockGetSites).toHaveBeenCalled();
  });

  it("est en état loading pendant le fetch", async () => {
    let resolvePromise!: (value: typeof mockSites) => void;
    const pendingPromise = new Promise<typeof mockSites>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetSites.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useSites());

    // Initialement en loading
    expect(result.current.loading).toBe(true);
    expect(result.current.sites).toEqual([]);

    // Résoudre la promesse
    await act(async () => {
      resolvePromise(mockSites);
      await pendingPromise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("gère les erreurs si l'API échoue", async () => {
    mockGetSites.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("Impossible de charger les sites");
    expect(result.current.sites).toEqual([]);
  });

  it("refetch recharge les données", async () => {
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

  it("réinitialise l'erreur lors d'un refetch réussi", async () => {
    mockGetSites.mockRejectedValue(new Error("Erreur réseau"));

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();

    // Refetch avec succès
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
