import { describe, expect, it, vi } from "vitest";

import { isIosDevice, isStandaloneDisplayMode } from "../pwa-install";

describe("isIosDevice", () => {
  it("SHOULD return true WHEN the user agent is an iPhone", () => {
    expect(
      isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"),
    ).toBe(true);
  });

  it("SHOULD return true WHEN the user agent is an iPad", () => {
    expect(isIosDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15")).toBe(
      true,
    );
  });

  it("SHOULD return false WHEN the user agent is Android", () => {
    expect(isIosDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36")).toBe(false);
  });

  it("SHOULD return false WHEN the user agent is desktop Chrome", () => {
    expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")).toBe(
      false,
    );
  });
});

describe("isStandaloneDisplayMode", () => {
  const fakeWindow = (matches: boolean): Window =>
    ({ matchMedia: vi.fn().mockReturnValue({ matches }) }) as unknown as Window;

  it("SHOULD return true WHEN navigator.standalone is true (iOS Safari)", () => {
    const nav = { standalone: true } as unknown as Navigator;
    expect(isStandaloneDisplayMode(nav, fakeWindow(false))).toBe(true);
  });

  it("SHOULD return true WHEN the display-mode: standalone media query matches", () => {
    const nav = {} as Navigator;
    expect(isStandaloneDisplayMode(nav, fakeWindow(true))).toBe(true);
  });

  it("SHOULD return false WHEN neither signal indicates standalone", () => {
    const nav = { standalone: false } as unknown as Navigator;
    expect(isStandaloneDisplayMode(nav, fakeWindow(false))).toBe(false);
  });
});
