import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointWithConnectors } from "@/types/charge-point";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.commissioning.title": "Awaiting commissioning",
      "appPage.chargePoints.commissioning.description": "Discovered charge points.",
      "appPage.chargePoints.commissioning.cta": "Commission",
    };
    if (key === "appPage.chargePoints.commissioning.connectorsWithCount") {
      return `${params?.count} connectors`;
    }
    return map[key] ?? key;
  },
}));

import { CommissioningQueue } from "../CommissioningQueue";

const makeChargePoint = (
  overrides: Partial<ChargePointWithConnectors> = {},
): ChargePointWithConnectors => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "CP-001",
  siteId: null,
  isActive: true,
  connection: { status: "CONNECTED", lastSeenAt: null },
  ocppVersion: "1.6",
  meta: {},
  connectors: [],
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

afterEach(() => cleanup());

describe("CommissioningQueue", () => {
  it("SHOULD render nothing WHEN there are no unassigned charge points", () => {
    const { container } = render(<CommissioningQueue chargePoints={[]} onCommission={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it("SHOULD list each unassigned charge point with a commission CTA WHEN given some", () => {
    render(
      <CommissioningQueue
        chargePoints={[
          makeChargePoint({ id: "a", name: "CP-A" }),
          makeChargePoint({ id: "b", name: "CP-B" }),
        ]}
        onCommission={vi.fn()}
      />,
    );

    expect(screen.getByText("CP-A")).toBeTruthy();
    expect(screen.getByText("CP-B")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /commission/i })).toHaveLength(2);
  });

  it("SHOULD call onCommission with the charge point WHEN its CTA is clicked", () => {
    const onCommission = vi.fn();
    const cp = makeChargePoint({ id: "a", name: "CP-A" });

    render(<CommissioningQueue chargePoints={[cp]} onCommission={onCommission} />);
    fireEvent.click(screen.getByRole("button", { name: /commission/i }));

    expect(onCommission).toHaveBeenCalledWith(cp);
  });
});
