import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => key,
}));

const hook = vi.hoisted(() => ({ useChargePointAlertThresholds: vi.fn() }));
vi.mock("../../../hooks/useChargePointAlertThresholds", () => hook);

import { ChargePointAlertThresholdsSection } from "../ChargePointAlertThresholdsSection";

const EFFECTIVE = {
  values: {
    offlineAfterMs: 900_000,
    connectorStuckUnavailableAfterMs: 14_400_000,
    firmwareStaleAfterMs: 1_800_000,
  },
  sources: {
    offlineAfterMs: "chargePoint",
    connectorStuckUnavailableAfterMs: "default",
    firmwareStaleAfterMs: "site",
  },
};

const THRESHOLDS = {
  chargePointId: "cp-1",
  offlineAfterMs: 900_000,
  connectorStuckUnavailableAfterMs: null,
  firmwareStaleAfterMs: null,
};

const updateThresholds = vi.fn().mockResolvedValue(undefined);
const resetThresholds = vi.fn().mockResolvedValue(undefined);

const mockHook = (overrides: object = {}) =>
  hook.useChargePointAlertThresholds.mockReturnValue({
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

describe("ChargePointAlertThresholdsSection", () => {
  it("SHOULD load the thresholds of the given charge point", () => {
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    expect(hook.useChargePointAlertThresholds).toHaveBeenCalledWith("cp-1");
  });

  it("SHOULD show the loading state and no edit button WHEN loading", () => {
    mockHook({ loading: true, effective: null });
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    expect(screen.getByText("appPage.chargePoints.detail.alertThresholds.loading")).toBeTruthy();
    expect(screen.queryByText("appPage.chargePoints.detail.alertThresholds.editButton")).toBeNull();
  });

  it("SHOULD show the error WHEN the load fails", () => {
    mockHook({ error: true, effective: null });
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    expect(screen.getByText("appPage.chargePoints.detail.alertThresholds.loadError")).toBeTruthy();
  });

  it("SHOULD name the level of each value, from the station itself to the default", () => {
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    expect(screen.getByText("appPage.alertThresholds.source.chargePoint")).toBeTruthy();
    expect(screen.getByText("appPage.alertThresholds.source.site")).toBeTruthy();
    expect(screen.getByText("appPage.alertThresholds.source.default")).toBeTruthy();
  });

  it("SHOULD not offer a reset WHEN the charge point has no overrides of its own", () => {
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    expect(
      screen.queryByText("appPage.chargePoints.detail.alertThresholds.resetButton"),
    ).toBeNull();
  });

  it("SHOULD reset the overrides WHEN the reset button is clicked", () => {
    mockHook({ thresholds: THRESHOLDS });
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    fireEvent.click(screen.getByText("appPage.chargePoints.detail.alertThresholds.resetButton"));

    expect(resetThresholds).toHaveBeenCalledTimes(1);
  });

  it("SHOULD prefill the dialog with the station's own overrides only", () => {
    mockHook({ thresholds: THRESHOLDS });
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    fireEvent.click(screen.getByText("appPage.chargePoints.detail.alertThresholds.editButton"));

    // Inherited fields stay empty rather than being pre-filled with the site's value,
    // otherwise saving would silently turn an inherited value into an override.
    expect(
      (screen.getAllByRole("spinbutton") as HTMLInputElement[]).map((input) => input.value),
    ).toEqual(["15", "", ""]);
  });

  it("SHOULD send the patch and close the dialog WHEN the form is saved", async () => {
    render(<ChargePointAlertThresholdsSection chargePointId="cp-1" />);

    fireEvent.click(screen.getByText("appPage.chargePoints.detail.alertThresholds.editButton"));
    fireEvent.change(screen.getAllByRole("spinbutton")[2], { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() =>
      expect(updateThresholds).toHaveBeenCalledWith({
        offlineAfterMs: null,
        connectorStuckUnavailableAfterMs: null,
        firmwareStaleAfterMs: 7_200_000,
      }),
    );
    await waitFor(() => expect(screen.queryAllByRole("spinbutton")).toHaveLength(0));
  });
});
