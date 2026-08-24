import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getSettings, setSetting } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  setSetting: vi.fn(),
}));

// Mocked via the relative module path (not the "@/lib/api" alias): vi.mock
// resolves its target against this file, and this project's Vitest config does
// not alias "@/" for the mock resolver — so an aliased target would silently
// fail to intercept and the real fetch would run. Matches the repo convention
// of relative vi.mock targets.
vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { getSettings, setSetting } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ChargePointConfigurationDialog } from "../ChargePointConfigurationDialog";

afterEach(() => {
  cleanup();
  getSettings.mockReset();
  setSetting.mockReset();
});

describe("ChargePointConfigurationDialog", () => {
  it("SHOULD fetch and list the reported configuration WHEN opened", async () => {
    getSettings.mockResolvedValue({
      ok: true,
      configurationKey: [{ key: "HeartbeatInterval", readonly: false, value: "300" }],
    });

    render(<ChargePointConfigurationDialog chargePointId="cp-1" chargePointName="CP-A" />);
    fireEvent.click(
      screen.getByRole("button", { name: "appPage.chargePoints.configuration.button" }),
    );

    await waitFor(() => expect(screen.getByText("HeartbeatInterval")).toBeTruthy());
    expect(screen.getByText("300")).toBeTruthy();
    expect(getSettings).toHaveBeenCalledWith("cp-1");
  });

  it("SHOULD show an error message WHEN the station is offline", async () => {
    getSettings.mockResolvedValue({ ok: false, httpStatus: 409 });

    render(<ChargePointConfigurationDialog chargePointId="cp-1" chargePointName="CP-A" />);
    fireEvent.click(
      screen.getByRole("button", { name: "appPage.chargePoints.configuration.button" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("appPage.chargePoints.configuration.result.notConnected"),
      ).toBeTruthy(),
    );
  });

  it("SHOULD apply a key change then re-read the configuration WHEN Apply is clicked", async () => {
    getSettings.mockResolvedValue({ ok: true, configurationKey: [] });
    setSetting.mockResolvedValue({ ok: true, status: "Accepted" });

    render(<ChargePointConfigurationDialog chargePointId="cp-1" chargePointName="CP-A" />);
    fireEvent.click(
      screen.getByRole("button", { name: "appPage.chargePoints.configuration.button" }),
    );
    await waitFor(() => expect(getSettings).toHaveBeenCalledTimes(1));

    fireEvent.change(
      screen.getByPlaceholderText("appPage.chargePoints.configuration.set.keyPlaceholder"),
      {
        target: { value: "HeartbeatInterval" },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText("appPage.chargePoints.configuration.set.valuePlaceholder"),
      { target: { value: "600" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "appPage.chargePoints.configuration.set.button" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("appPage.chargePoints.configuration.set.result.accepted"),
      ).toBeTruthy(),
    );
    expect(setSetting).toHaveBeenCalledWith("cp-1", "HeartbeatInterval", "600");
    // Re-reads after a successful change.
    expect(getSettings).toHaveBeenCalledTimes(2);
  });
});
