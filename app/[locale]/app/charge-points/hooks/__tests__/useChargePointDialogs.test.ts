import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreatedChargePoint } from "../../../../../../types/charge-point";
import { useChargePointDialogs } from "../useChargePointDialogs";
import { chargePoint } from "./fixtures";

describe("useChargePointDialogs", () => {
  it("SHOULD start with every dialog closed", () => {
    const { result } = renderHook(() => useChargePointDialogs());

    expect(result.current.createOpen).toBe(false);
    expect(result.current.createdChargePoint).toBeNull();
    expect(result.current.editTarget).toBeNull();
    expect(result.current.commissionTarget).toBeNull();
    expect(result.current.deleteTarget).toBeNull();
  });

  it("SHOULD open and close each target independently", () => {
    const { result } = renderHook(() => useChargePointDialogs());
    const cp = chargePoint("a");

    act(() => result.current.openEdit(cp));
    act(() => result.current.openDelete(cp));
    expect(result.current.editTarget).toBe(cp);
    expect(result.current.deleteTarget).toBe(cp);

    act(() => result.current.closeEdit());
    expect(result.current.editTarget).toBeNull();
    expect(result.current.deleteTarget).toBe(cp);
  });

  it("SHOULD keep the create form open WHEN the created charge point is shown", () => {
    // The form closes itself once its submit resolves; showing the URL must not race it.
    const { result } = renderHook(() => useChargePointDialogs());

    act(() => result.current.openCreate());
    act(() => result.current.showCreated({ id: "new" } as CreatedChargePoint));

    expect(result.current.createOpen).toBe(true);
    expect(result.current.createdChargePoint?.id).toBe("new");

    act(() => result.current.closeCreated());
    expect(result.current.createdChargePoint).toBeNull();
  });
});
