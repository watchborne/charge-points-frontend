import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.connectionUrl.title": "Charge point created",
      "appPage.chargePoints.connectionUrl.description": `Configure "${values?.name}" by pasting this URL.`,
      "appPage.chargePoints.connectionUrl.copyCta": "Copy URL",
      "appPage.chargePoints.connectionUrl.hint": "Shown only once.",
      "appPage.chargePoints.connectionUrl.doneCta": "Done",
    };
    return map[key] ?? key;
  },
}));

import { ChargePointConnectionUrlDialog } from "../ChargePointConnectionUrlDialog";

const chargePoint = {
  id: "11111111-1111-4111-8111-111111111111",
  ocppIdentity: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
  name: "swift-relay",
  siteId: null,
  isActive: true,
  realtimeAlertsEnabled: false,
  connection: { status: "OFFLINE" as const, lastSeenAt: null },
  ocppVersion: "1.6" as const,
  meta: {},
  connectors: [],
  commissionedAt: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
  connectionUrl: "wss://ocpp.watch-borne.com/ocpp/aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
};

afterEach(() => cleanup());

describe("ChargePointConnectionUrlDialog", () => {
  it("SHOULD render the connection URL WHEN a charge point was created", () => {
    render(
      <ChargePointConnectionUrlDialog open onOpenChange={vi.fn()} chargePoint={chargePoint} />,
    );

    expect(screen.getByText(chargePoint.connectionUrl)).toBeTruthy();
    expect(screen.getByText(/swift-relay/)).toBeTruthy();
  });

  it("SHOULD copy the connection URL to the clipboard WHEN the copy button is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ChargePointConnectionUrlDialog open onOpenChange={vi.fn()} chargePoint={chargePoint} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy URL" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(chargePoint.connectionUrl));
  });

  it("SHOULD render nothing charge-point-specific WHEN no charge point is given", () => {
    render(<ChargePointConnectionUrlDialog open onOpenChange={vi.fn()} chargePoint={null} />);

    expect(screen.queryByText(/wss:\/\//)).toBeNull();
  });

  it("SHOULD close WHEN the done button is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <ChargePointConnectionUrlDialog open onOpenChange={onOpenChange} chargePoint={chargePoint} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
