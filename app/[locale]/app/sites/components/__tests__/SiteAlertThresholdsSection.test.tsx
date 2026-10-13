import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => key,
}));

const hook = vi.hoisted(() => ({ useSiteAlertThresholds: vi.fn() }));
vi.mock("../../../hooks/useSiteAlertThresholds", () => hook);

import { SiteAlertThresholdsSection } from "../SiteAlertThresholdsSection";

const EFFECTIVE = {
  values: {
    offlineAfterMs: 14_400_000,
    connectorStuckUnavailableAfterMs: 14_400_000,
    firmwareStaleAfterMs: 1_800_000,
  },
  sources: {
    offlineAfterMs: "site",
    connectorStuckUnavailableAfterMs: "default",
    firmwareStaleAfterMs: "default",
  },
};

const THRESHOLDS = {
  siteId: "site-1",
  offlineAfterMs: 14_400_000,
  connectorStuckUnavailableAfterMs: null,
  firmwareStaleAfterMs: null,
};

const updateThresholds = vi.fn().mockResolvedValue(undefined);
const resetThresholds = vi.fn().mockResolvedValue(undefined);

const mockHook = (overrides: object = {}) =>
  hook.useSiteAlertThresholds.mockReturnValue({
    thresholds: null,
    effective: EFFECTIVE,
    loading: false,
    error: false,
    updateThresholds,
    resetThresholds,
    isSaving: false,
    ...overrides,
  });

beforeEach(() => mockHook());
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SiteAlertThresholdsSection", () => {
  it("SHOULD load the thresholds of the given site", () => {
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    expect(hook.useSiteAlertThresholds).toHaveBeenCalledWith("site-1");
  });

  it("SHOULD show the loading state and no edit button WHEN loading", () => {
    mockHook({ loading: true, effective: null });
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    expect(screen.getByText("appPage.sites.detail.alertThresholds.loading")).toBeTruthy();
    expect(screen.queryByText("appPage.sites.detail.alertThresholds.editButton")).toBeNull();
  });

  it("SHOULD show the error WHEN the load fails", () => {
    mockHook({ error: true, effective: null });
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    expect(screen.getByText("appPage.sites.detail.alertThresholds.loadError")).toBeTruthy();
  });

  it("SHOULD show the effective thresholds and an edit button", () => {
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    expect(screen.getByText("appPage.alertThresholds.source.site")).toBeTruthy();
    expect(screen.getByText("appPage.sites.detail.alertThresholds.editButton")).toBeTruthy();
  });

  it("SHOULD not offer a reset WHEN the site has no overrides", () => {
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    expect(screen.queryByText("appPage.sites.detail.alertThresholds.resetButton")).toBeNull();
  });

  it("SHOULD reset the overrides WHEN the reset button is clicked", () => {
    mockHook({ thresholds: THRESHOLDS });
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    fireEvent.click(screen.getByText("appPage.sites.detail.alertThresholds.resetButton"));

    expect(resetThresholds).toHaveBeenCalledTimes(1);
  });

  it("SHOULD send the patch and close the dialog WHEN the form is saved", async () => {
    render(<SiteAlertThresholdsSection siteId="site-1" />);

    fireEvent.click(screen.getByText("appPage.sites.detail.alertThresholds.editButton"));
    const [offline] = screen.getAllByRole("spinbutton");
    fireEvent.change(offline, { target: { value: "240" } });
    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() =>
      expect(updateThresholds).toHaveBeenCalledWith({
        offlineAfterMs: 14_400_000,
        connectorStuckUnavailableAfterMs: null,
        firmwareStaleAfterMs: null,
      }),
    );
    await waitFor(() => expect(screen.queryAllByRole("spinbutton")).toHaveLength(0));
  });
});
