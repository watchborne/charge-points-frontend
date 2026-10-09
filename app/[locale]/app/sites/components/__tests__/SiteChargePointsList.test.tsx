import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => key,
}));

import { SiteChargePointsList } from "../SiteChargePointsList";

afterEach(() => cleanup());

const chargePoint = (id: string, name: string): ChargePointWithConnectors =>
  ({
    id,
    name,
    meta: { vendor: "ABB", model: "Terra" },
    connection: { status: "SYNCED", lastSeenAt: new Date() },
    connectors: [{ id: `${id}-1`, connectorId: 1, status: "Available" }],
  }) as unknown as ChargePointWithConnectors;

describe("SiteChargePointsList", () => {
  it("SHOULD show a row per charge point, collapsed", () => {
    render(
      <SiteChargePointsList
        chargePoints={[chargePoint("cp-1", "CP-001"), chargePoint("cp-2", "CP-002")]}
        onViewChargePoint={vi.fn()}
      />,
    );

    expect(screen.getByText("CP-001")).toBeTruthy();
    expect(screen.getByText("CP-002")).toBeTruthy();
    expect(screen.queryByText("ABB Terra")).toBeNull();
  });

  it("SHOULD reveal the vendor/model WHEN a row is clicked", () => {
    render(
      <SiteChargePointsList
        chargePoints={[chargePoint("cp-1", "CP-001")]}
        onViewChargePoint={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("CP-001"));

    expect(screen.getByText("ABB Terra")).toBeTruthy();
  });

  it("SHOULD call onViewChargePoint WITHOUT expanding the row WHEN the open button is clicked", () => {
    const onViewChargePoint = vi.fn();
    render(
      <SiteChargePointsList
        chargePoints={[chargePoint("cp-1", "CP-001")]}
        onViewChargePoint={onViewChargePoint}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "appPage.dashboard.viewChargePoint" }));

    expect(onViewChargePoint).toHaveBeenCalledWith("cp-1");
    expect(screen.queryByText("ABB Terra")).toBeNull();
  });

  it("SHOULD render the empty state WHEN the site has no charge point", () => {
    render(<SiteChargePointsList chargePoints={[]} onViewChargePoint={vi.fn()} />);

    expect(screen.getByText("appPage.sites.detail.noChargePoints")).toBeTruthy();
  });
});
