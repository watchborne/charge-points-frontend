import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useToastNotification } from "../useToastNotification";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("useToastNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SHOULD call sonner's toast.warning WHEN pushWarningNotification is called", () => {
    const { result } = renderHook(() => useToastNotification());

    result.current.pushWarningNotification("Unexpected transition");

    expect(toast.warning).toHaveBeenCalledWith("Unexpected transition", {});
  });

  it("SHOULD return the same function references WHEN the hook re-renders", () => {
    const { result, rerender } = renderHook(() => useToastNotification());
    const firstRender = result.current;

    rerender();

    expect(result.current.pushWarningNotification).toBe(firstRender.pushWarningNotification);
    expect(result.current.pushSuccessNotification).toBe(firstRender.pushSuccessNotification);
    expect(result.current.pushErrorNotification).toBe(firstRender.pushErrorNotification);
  });
});
