import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useSearchParams: () => mocks.params }));
// The real panel drags in the whole detail tree; only its tab vocabulary matters here.
vi.mock("../../components/ChargePointDetailPanel", () => ({
  isDetailTab: (value: string) => ["main", "alerts", "security"].includes(value),
}));
vi.mock("../../../../../../i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

import { useChargePointDeepLink } from "../useChargePointDeepLink";
import { chargePoint } from "./fixtures";

const FLEET = [chargePoint("a"), chargePoint("b")];

describe("useChargePointDeepLink", () => {
  beforeEach(() => {
    mocks.params = new URLSearchParams();
    mocks.replace.mockClear();
  });

  it("SHOULD select nothing WHEN the URL has no id", () => {
    const { result } = renderHook(() =>
      useChargePointDeepLink({ chargePoints: FLEET, loading: false }),
    );

    expect(result.current.selected).toBeNull();
  });

  it("SHOULD select the deep-linked charge point, with its tab, WHEN loading is over", () => {
    mocks.params = new URLSearchParams("id=b&tab=alerts");

    const { result } = renderHook(() =>
      useChargePointDeepLink({ chargePoints: FLEET, loading: false }),
    );

    expect(result.current.selected?.id).toBe("b");
    expect(result.current.initialTab).toBe("alerts");
  });

  it("SHOULD wait for the lists WHEN they are still loading", () => {
    mocks.params = new URLSearchParams("id=b");

    const { result, rerender } = renderHook(
      ({ loading }) => useChargePointDeepLink({ chargePoints: FLEET, loading }),
      { initialProps: { loading: true } },
    );
    expect(result.current.selected).toBeNull();

    rerender({ loading: false });
    expect(result.current.selected?.id).toBe("b");
  });

  it("SHOULD ignore an unknown tab", () => {
    mocks.params = new URLSearchParams("id=a&tab=nonsense");

    const { result } = renderHook(() =>
      useChargePointDeepLink({ chargePoints: FLEET, loading: false }),
    );

    expect(result.current.initialTab).toBeUndefined();
  });

  it("SHOULD NOT re-select the link WHEN the user closed the detail", () => {
    // The id stays in the URL until the router has replaced it; closing must stick.
    mocks.params = new URLSearchParams("id=a");
    const { result } = renderHook(() =>
      useChargePointDeepLink({ chargePoints: FLEET, loading: false }),
    );
    expect(result.current.selected?.id).toBe("a");

    act(() => result.current.select(null));

    expect(result.current.selected).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith("/app/charge-points");
  });

  it("SHOULD follow its charge point WHEN the list refreshes", () => {
    mocks.params = new URLSearchParams("id=a");
    const { result, rerender } = renderHook(
      ({ chargePoints }) => useChargePointDeepLink({ chargePoints, loading: false }),
      { initialProps: { chargePoints: FLEET } },
    );

    rerender({ chargePoints: [chargePoint("a", { name: "Renamed" }), chargePoint("b")] });

    expect(result.current.selected?.name).toBe("Renamed");
  });

  it("SHOULD drop the tab from the URL WHEN selecting, and write it WHEN switching tab", () => {
    const { result } = renderHook(() =>
      useChargePointDeepLink({ chargePoints: FLEET, loading: false }),
    );

    act(() => result.current.select(FLEET[0]));
    expect(mocks.replace).toHaveBeenLastCalledWith("/app/charge-points?id=a");

    act(() => result.current.changeTab("security"));
    expect(mocks.replace).toHaveBeenLastCalledWith("/app/charge-points?id=a&tab=security");
  });

  it("SHOULD only expose the tab for the deep-linked charge point", () => {
    mocks.params = new URLSearchParams("id=a&tab=alerts");
    const { result } = renderHook(() =>
      useChargePointDeepLink({ chargePoints: FLEET, loading: false }),
    );

    act(() => result.current.select(FLEET[1]));

    expect(result.current.initialTab).toBeUndefined();
  });
});
