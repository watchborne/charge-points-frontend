import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values ? `${key}:${Object.values(values).join(",")}` : key,
}));

import { DashboardLayoutDialog } from "../DashboardLayoutDialog";

const layout = [
  { id: "siteHealth" as const, visible: true },
  { id: "chargePointsBreakdown" as const, visible: true },
  { id: "fleetOverview" as const, visible: false },
];

afterEach(() => cleanup());

describe("DashboardLayoutDialog", () => {
  it("SHOULD render every widget's label from the layout WHEN open", () => {
    render(
      <DashboardLayoutDialog
        open
        onOpenChange={vi.fn()}
        layout={layout}
        onToggleVisibility={vi.fn()}
        onMove={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText("appPage.dashboard.layout.widgets.siteHealth")).toBeTruthy();
    expect(screen.getByText("appPage.dashboard.layout.widgets.chargePointsBreakdown")).toBeTruthy();
    expect(screen.getByText("appPage.dashboard.layout.widgets.fleetOverview")).toBeTruthy();
  });

  it("SHOULD disable moving the first widget up and the last widget down", () => {
    render(
      <DashboardLayoutDialog
        open
        onOpenChange={vi.fn()}
        layout={layout}
        onToggleVisibility={vi.fn()}
        onMove={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      (
        screen.getByRole("button", {
          name: "appPage.dashboard.layout.moveUp:appPage.dashboard.layout.widgets.siteHealth",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "appPage.dashboard.layout.moveDown:appPage.dashboard.layout.widgets.fleetOverview",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("SHOULD call onMove with the widget id and direction WHEN a move button is clicked", () => {
    const onMove = vi.fn();

    render(
      <DashboardLayoutDialog
        open
        onOpenChange={vi.fn()}
        layout={layout}
        onToggleVisibility={vi.fn()}
        onMove={onMove}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "appPage.dashboard.layout.moveDown:appPage.dashboard.layout.widgets.siteHealth",
      }),
    );

    expect(onMove).toHaveBeenCalledWith("siteHealth", "down");
  });

  it("SHOULD call onToggleVisibility with the widget id WHEN its switch is clicked", () => {
    const onToggleVisibility = vi.fn();

    render(
      <DashboardLayoutDialog
        open
        onOpenChange={vi.fn()}
        layout={layout}
        onToggleVisibility={onToggleVisibility}
        onMove={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("switch", {
        name: "appPage.dashboard.layout.toggleVisible:appPage.dashboard.layout.widgets.fleetOverview",
      }),
    );

    expect(onToggleVisibility).toHaveBeenCalledWith("fleetOverview");
  });

  it("SHOULD call onReset WHEN the reset button is clicked", () => {
    const onReset = vi.fn();

    render(
      <DashboardLayoutDialog
        open
        onOpenChange={vi.fn()}
        layout={layout}
        onToggleVisibility={vi.fn()}
        onMove={vi.fn()}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByText("appPage.dashboard.layout.reset"));

    expect(onReset).toHaveBeenCalled();
  });

  it("SHOULD close the dialog WHEN the done button is clicked", () => {
    const onOpenChange = vi.fn();

    render(
      <DashboardLayoutDialog
        open
        onOpenChange={onOpenChange}
        layout={layout}
        onToggleVisibility={vi.fn()}
        onMove={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("appPage.dashboard.layout.done"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
