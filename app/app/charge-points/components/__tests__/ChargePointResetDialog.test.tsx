import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ChargePoint } from "@/types/charge-point";

import { ChargePointResetDialog } from "../ChargePointResetDialog";

const target = { id: "cp-1", name: "CP-001" } as ChargePoint;

afterEach(() => cleanup());

describe("ChargePointResetDialog", () => {
  it("SHOULD confirm with the default Hard type and show the accepted result WHEN the station accepts", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: true, status: "Accepted" });
    render(
      <ChargePointResetDialog resetTarget={target} onOpenChange={() => {}} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "appPage.chargePoints.reset.confirm" }));

    await waitFor(() =>
      expect(screen.getByText("appPage.chargePoints.reset.result.accepted")).toBeTruthy(),
    );
    expect(onConfirm).toHaveBeenCalledWith("Hard");
  });

  it("SHOULD show the offline/rejected message WHEN the backend returns 409", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: false, httpStatus: 409 });
    render(
      <ChargePointResetDialog resetTarget={target} onOpenChange={() => {}} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "appPage.chargePoints.reset.confirm" }));

    await waitFor(() =>
      expect(
        screen.getByText("appPage.chargePoints.reset.result.notConnectedOrRejected"),
      ).toBeTruthy(),
    );
  });

  it("SHOULD show the timeout message WHEN the backend returns 504", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: false, httpStatus: 504 });
    render(
      <ChargePointResetDialog resetTarget={target} onOpenChange={() => {}} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "appPage.chargePoints.reset.confirm" }));

    await waitFor(() =>
      expect(screen.getByText("appPage.chargePoints.reset.result.timeout")).toBeTruthy(),
    );
  });

  it("SHOULD render nothing WHEN there is no target", () => {
    render(
      <ChargePointResetDialog resetTarget={null} onOpenChange={() => {}} onConfirm={vi.fn()} />,
    );

    expect(screen.queryByText("appPage.chargePoints.reset.confirm")).toBeNull();
  });
});
