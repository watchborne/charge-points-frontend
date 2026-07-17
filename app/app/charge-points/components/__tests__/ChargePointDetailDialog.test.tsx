import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key} ${JSON.stringify(params)}` : key,
}));

import { ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointDetailDialog } from "../ChargePointDetailDialog";

// Radix's DropdownMenu opens on a trusted `pointerdown` and relies on
// pointer-capture / layout APIs jsdom doesn't implement; polyfill just enough
// for the trigger to open in tests.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
  if (!("PointerEvent" in globalThis)) {
    class PointerEvent extends MouseEvent {}
    // @ts-expect-error jsdom test polyfill
    globalThis.PointerEvent = PointerEvent;
  }
});

const openResetMenu = async () => {
  const trigger = screen.getByRole("button", { name: /appPage.chargePoints.reset.button/ });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
};

const CHARGE_POINT = {
  id: "cp-1",
  name: "CP-001",
  siteId: "site-1",
  isActive: true,
  ocppVersion: "1.6",
  connection: { status: "SYNCED", lastSeenAt: null },
  meta: {},
  connectors: [],
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
} as unknown as ChargePointWithConnectors;

const noop = () => {};

afterEach(() => cleanup());

describe("ChargePointDetailDialog — reset action", () => {
  it("SHOULD call onReset with Hard and show the accepted result WHEN Hard is selected", async () => {
    const onReset = vi.fn().mockResolvedValue({ ok: true, status: "Accepted" });
    render(
      <ChargePointDetailDialog
        chargePoint={CHARGE_POINT}
        site={undefined}
        onOpenChange={noop}
        onEditClicked={noop}
        onDeleteClicked={noop}
        onReset={onReset}
      />,
    );

    await openResetMenu();
    fireEvent.click(await screen.findByText("appPage.chargePoints.reset.types.hard"));

    await waitFor(() =>
      expect(screen.getByText("appPage.chargePoints.reset.result.accepted")).toBeTruthy(),
    );
    expect(onReset).toHaveBeenCalledWith(CHARGE_POINT, "Hard");
  });

  it("SHOULD call onReset with Soft WHEN Soft is selected", async () => {
    const onReset = vi.fn().mockResolvedValue({ ok: true, status: "Accepted" });
    render(
      <ChargePointDetailDialog
        chargePoint={CHARGE_POINT}
        site={undefined}
        onOpenChange={noop}
        onEditClicked={noop}
        onDeleteClicked={noop}
        onReset={onReset}
      />,
    );

    await openResetMenu();
    fireEvent.click(await screen.findByText("appPage.chargePoints.reset.types.soft"));

    await waitFor(() => expect(onReset).toHaveBeenCalledWith(CHARGE_POINT, "Soft"));
  });

  it("SHOULD show the offline/rejected message WHEN the backend returns 409", async () => {
    const onReset = vi.fn().mockResolvedValue({ ok: false, httpStatus: 409 });
    render(
      <ChargePointDetailDialog
        chargePoint={CHARGE_POINT}
        site={undefined}
        onOpenChange={noop}
        onEditClicked={noop}
        onDeleteClicked={noop}
        onReset={onReset}
      />,
    );

    await openResetMenu();
    fireEvent.click(await screen.findByText("appPage.chargePoints.reset.types.hard"));

    await waitFor(() =>
      expect(
        screen.getByText("appPage.chargePoints.reset.result.notConnectedOrRejected"),
      ).toBeTruthy(),
    );
  });

  it("SHOULD render nothing WHEN there is no charge point", () => {
    render(
      <ChargePointDetailDialog
        chargePoint={null}
        site={undefined}
        onOpenChange={noop}
        onEditClicked={noop}
        onDeleteClicked={noop}
        onReset={vi.fn()}
      />,
    );

    expect(screen.queryByText(/reset.button/)).toBeNull();
  });
});
