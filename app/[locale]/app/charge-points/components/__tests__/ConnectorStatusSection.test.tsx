import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ChargePointWithConnectors } from "@/types/charge-point";

import { ConnectorStatusSection } from "../ConnectorStatusSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values && Object.keys(values).length > 0) {
      const paramList = Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      return `${key}(${paramList})`;
    }
    return key;
  },
}));

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CONNECTOR = {
  id: "connector-1",
  chargePointId: "cp-1",
  connectorId: 1,
  status: "Available",
  lastMeterValue: {
    timestamp: new Date("2024-01-01T00:00:00Z"),
    sampledValue: [{ value: "1000", measurand: "Energy.Active.Import.Register", unit: "Wh" }],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as Record<string, unknown>;

const buildChargePoint = (connectors: Record<string, unknown>[]) =>
  ({
    id: "cp-1",
    connectors,
  }) as unknown as ChargePointWithConnectors;

const renderSection = (connectors: Record<string, unknown>[]) =>
  render(
    <ConnectorStatusSection
      chargePoint={buildChargePoint(connectors)}
      availabilityState={{}}
      unlockConnectorState={{}}
      onChangeAvailability={vi.fn()}
      onUnlockConnector={vi.fn()}
    />,
  );

describe("ConnectorStatusSection", () => {
  it("SHOULD carry the sampled values and relative time in a tooltip WHEN the connector reported one", async () => {
    renderSection([CONNECTOR]);

    // The trigger itself only shows the icon — the reading lives in the
    // tooltip, which Radix only mounts once open. Focus is the
    // keyboard-equivalent trigger (no hover delay, unlike a pointer hover).
    const trigger = screen.getByLabelText("appPage.chargePoints.detail.lastMeterValue");
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toContain("1000 Wh");
  });

  it("SHOULD name the tooltip trigger for a screen reader via aria-label", () => {
    renderSection([CONNECTOR]);

    expect(screen.getByLabelText("appPage.chargePoints.detail.lastMeterValue")).toBeTruthy();
  });

  it("SHOULD render no tooltip trigger WHEN the connector never reported a meter value", () => {
    renderSection([{ ...CONNECTOR, lastMeterValue: undefined }]);

    expect(screen.queryByLabelText("appPage.chargePoints.detail.lastMeterValue")).toBeNull();
  });
});
