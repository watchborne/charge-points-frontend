import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string, values?: Record<string, number>) =>
    values ? `${key}|${Object.values(values).join(",")}` : key,
}));

import { AlertThresholdsSummary } from "../AlertThresholdsSummary";

afterEach(() => cleanup());

const EFFECTIVE = {
  values: {
    offlineAfterMs: 14_400_000,
    connectorStuckUnavailableAfterMs: 14_400_000,
    firmwareStaleAfterMs: 1_800_000,
  },
  sources: {
    offlineAfterMs: "site" as const,
    connectorStuckUnavailableAfterMs: "default" as const,
    firmwareStaleAfterMs: "chargePoint" as const,
  },
};

describe("AlertThresholdsSummary", () => {
  it("SHOULD list the three thresholds with their label", () => {
    render(<AlertThresholdsSummary effective={EFFECTIVE} />);

    expect(screen.getByText("appPage.alertThresholds.fields.offlineAfterMs.label")).toBeTruthy();
    expect(
      screen.getByText("appPage.alertThresholds.fields.connectorStuckUnavailableAfterMs.label"),
    ).toBeTruthy();
    expect(
      screen.getByText("appPage.alertThresholds.fields.firmwareStaleAfterMs.label"),
    ).toBeTruthy();
  });

  it("SHOULD format each value in its best unit", () => {
    render(<AlertThresholdsSummary effective={EFFECTIVE} />);

    expect(screen.getAllByText(/appPage\.alertThresholds\.duration\.hours\|4/)).toHaveLength(2);
    expect(screen.getByText(/appPage\.alertThresholds\.duration\.minutes\|30/)).toBeTruthy();
  });

  it("SHOULD name the level each value comes from", () => {
    render(<AlertThresholdsSummary effective={EFFECTIVE} />);

    expect(screen.getByText("appPage.alertThresholds.source.site")).toBeTruthy();
    expect(screen.getByText("appPage.alertThresholds.source.default")).toBeTruthy();
    expect(screen.getByText("appPage.alertThresholds.source.chargePoint")).toBeTruthy();
  });
});
