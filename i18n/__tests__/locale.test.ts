import { describe, expect, it } from "vitest";

import { isLocale, localizedPath } from "../locale";

describe("isLocale", () => {
  it("SHOULD return true WHEN the value is a supported locale", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("SHOULD return false WHEN the value is not a supported locale", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("localizedPath", () => {
  it("SHOULD return the path unchanged WHEN the locale is the default (fr)", () => {
    expect(localizedPath("/app/dashboard", "fr")).toBe("/app/dashboard");
  });

  it("SHOULD prefix the path WHEN the locale is not the default", () => {
    expect(localizedPath("/app/dashboard", "en")).toBe("/en/app/dashboard");
  });
});
