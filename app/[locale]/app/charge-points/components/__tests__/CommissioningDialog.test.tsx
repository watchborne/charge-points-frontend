import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.commissioning.dialog.title": "Commissioning",
      "appPage.chargePoints.commissioning.dialog.description": "Name and attach.",
      "appPage.chargePoints.commissioning.dialog.submit": "Commission",
      "appPage.chargePoints.form.fields.name": "Name",
      "appPage.chargePoints.form.fields.namePlaceholder": "e.g. CP-001",
      "appPage.chargePoints.form.fields.ocppIdentity": "OCPP identity",
      "appPage.chargePoints.form.fields.ocppIdentityCaption": "Fixed wire identity, never changes.",
      "appPage.chargePoints.form.fields.site": "Site",
      "appPage.chargePoints.form.buttons.cancel": "Cancel",
    };
    return map[key] ?? key;
  },
}));

import { CommissioningDialog } from "../CommissioningDialog";

const chargePoint = {
  id: "11111111-1111-4111-8111-111111111111",
  ocppIdentity: "CP-RAW-01",
  name: "CP-RAW-01",
  siteId: null,
  isActive: true,
  connection: { status: "CONNECTED", lastSeenAt: null },
  ocppVersion: "1.6",
  meta: {},
  connectors: [],
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
} as ChargePointWithConnectors;

afterEach(() => cleanup());

describe("CommissioningDialog", () => {
  it("SHOULD prefill the charge point's current name WHEN opened", () => {
    render(
      <CommissioningDialog
        open
        onOpenChange={vi.fn()}
        chargePoint={chargePoint}
        sites={[]}
        onCommission={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox")).toHaveProperty("value", "CP-RAW-01");
  });

  it("SHOULD show the charge point's ocppIdentity read-only WHEN opened", () => {
    render(
      <CommissioningDialog
        open
        onOpenChange={vi.fn()}
        chargePoint={{ ...chargePoint, ocppIdentity: "CP-RAW-01-WIRE" }}
        sites={[]}
        onCommission={vi.fn()}
      />,
    );

    expect(screen.getByText("CP-RAW-01-WIRE")).toBeTruthy();
    // Not editable: no textbox carries the raw wire identity, only the name field does.
    expect(screen.queryByDisplayValue("CP-RAW-01-WIRE")).toBeNull();
  });

  it("SHOULD commission with the new name and a null site WHEN no site is chosen", async () => {
    const onCommission = vi.fn().mockResolvedValue(undefined);
    render(
      <CommissioningDialog
        open
        onOpenChange={vi.fn()}
        chargePoint={chargePoint}
        sites={[]}
        onCommission={onCommission}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Parking A  " } });
    fireEvent.click(screen.getByRole("button", { name: "Commission" }));

    await waitFor(() =>
      // Name is trimmed; an empty site selection maps to null.
      expect(onCommission).toHaveBeenCalledWith({ name: "Parking A", siteId: null }),
    );
  });
});
