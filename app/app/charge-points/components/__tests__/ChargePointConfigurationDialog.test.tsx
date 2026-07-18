import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getConfiguration, changeConfiguration } = vi.hoisted(() => ({
  getConfiguration: vi.fn(),
  changeConfiguration: vi.fn(),
}));

// Mocked via the relative module path (not the "@/lib/api" alias): vi.mock
// resolves its target against this file, and this project's Vitest config does
// not alias "@/" for the mock resolver — so an aliased target would silently
// fail to intercept and the real fetch would run. Matches the repo convention
// of relative vi.mock targets.
vi.mock("../../../../../lib/api", () => ({
  api: { ChargePoints: { getConfiguration, changeConfiguration } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.configuration.button": "Configuration",
      "appPage.chargePoints.configuration.title": "OCPP configuration",
      "appPage.chargePoints.configuration.description": "Configuration reported.",
      "appPage.chargePoints.configuration.loading": "Reading…",
      "appPage.chargePoints.configuration.empty": "No configuration keys.",
      "appPage.chargePoints.configuration.readonly": "read-only",
      "appPage.chargePoints.configuration.unknownKeys": "Unknown keys",
      "appPage.chargePoints.configuration.result.notConnected": "Cannot read: offline.",
      "appPage.chargePoints.configuration.set.title": "Change a key",
      "appPage.chargePoints.configuration.set.keyPlaceholder": "Key",
      "appPage.chargePoints.configuration.set.valuePlaceholder": "Value",
      "appPage.chargePoints.configuration.set.button": "Apply",
      "appPage.chargePoints.configuration.set.result.accepted": "Change applied.",
    };
    return map[key] ?? key;
  },
}));

import { ChargePointConfigurationDialog } from "../ChargePointConfigurationDialog";

afterEach(() => {
  cleanup();
  getConfiguration.mockReset();
  changeConfiguration.mockReset();
});

describe("ChargePointConfigurationDialog", () => {
  it("SHOULD fetch and list the reported configuration WHEN opened", async () => {
    getConfiguration.mockResolvedValue({
      ok: true,
      configurationKey: [{ key: "HeartbeatInterval", readonly: false, value: "300" }],
    });

    render(<ChargePointConfigurationDialog chargePointId="cp-1" chargePointName="CP-A" />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));

    await waitFor(() => expect(screen.getByText("HeartbeatInterval")).toBeTruthy());
    expect(screen.getByText("300")).toBeTruthy();
    expect(getConfiguration).toHaveBeenCalledWith("cp-1");
  });

  it("SHOULD show an error message WHEN the station is offline", async () => {
    getConfiguration.mockResolvedValue({ ok: false, httpStatus: 409 });

    render(<ChargePointConfigurationDialog chargePointId="cp-1" chargePointName="CP-A" />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));

    await waitFor(() => expect(screen.getByText("Cannot read: offline.")).toBeTruthy());
  });

  it("SHOULD apply a key change then re-read the configuration WHEN Apply is clicked", async () => {
    getConfiguration.mockResolvedValue({ ok: true, configurationKey: [] });
    changeConfiguration.mockResolvedValue({ ok: true, status: "Accepted" });

    render(<ChargePointConfigurationDialog chargePointId="cp-1" chargePointName="CP-A" />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    await waitFor(() => expect(getConfiguration).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "HeartbeatInterval" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), { target: { value: "600" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => expect(screen.getByText("Change applied.")).toBeTruthy());
    expect(changeConfiguration).toHaveBeenCalledWith("cp-1", "HeartbeatInterval", "600");
    // Re-reads after a successful change.
    expect(getConfiguration).toHaveBeenCalledTimes(2);
  });
});
