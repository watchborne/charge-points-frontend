import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushErrorNotification } = vi.hoisted(() => ({ pushErrorNotification: vi.fn() }));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("../../../../components/ToastNotification", () => ({
  useToastNotification: () => ({ pushErrorNotification }),
}));

import { useCopyToClipboard } from "../useCopyToClipboard";

const stubClipboard = (writeText: (value: string) => Promise<void>) => {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
};

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pushErrorNotification.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("SHOULD flag copied then reset it after 2s WHEN the copy succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("secret");
    });

    expect(writeText).toHaveBeenCalledWith("secret");
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("SHOULD toast an error and not flag copied WHEN the clipboard rejects", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("NotAllowedError")));
    const { result } = renderHook(() => useCopyToClipboard());

    let ok = true;
    await act(async () => {
      ok = await result.current.copy("secret");
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(pushErrorNotification).toHaveBeenCalledWith("common.copyFailed");
  });

  it("SHOULD restart the reset timer WHEN copying twice in a row", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("a");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      await result.current.copy("a");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.copied).toBe(true);
  });

  it("SHOULD clear the pending timer WHEN unmounted", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result, unmount } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy("a");
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
