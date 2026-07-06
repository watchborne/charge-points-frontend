import { describe, expect, it } from "vitest";

import { isLocale, localeForHost, withLocaleParam } from "../locale";

describe("localeForHost", () => {
  it("SHOULD return fr WHEN the host ends with .fr", () => {
    expect(localeForHost("watch-borne.fr")).toBe("fr");
  });

  it("SHOULD return en WHEN the host ends with .com", () => {
    expect(localeForHost("watch-borne.com")).toBe("en");
  });

  it("SHOULD return en WHEN a subdomain host ends with .com", () => {
    expect(localeForHost("app.watch-borne.com")).toBe("en");
  });

  it("SHOULD return the default locale WHEN the host matches neither TLD", () => {
    expect(localeForHost("localhost:3001")).toBe("fr");
    expect(localeForHost("watchborne.netlify.app")).toBe("fr");
  });
});

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

describe("withLocaleParam", () => {
  it("SHOULD add the lang query param WHEN there is no existing query string", () => {
    expect(withLocaleParam("/pricing", "", "en")).toBe("/pricing?lang=en");
  });

  it("SHOULD preserve other query params WHEN setting the lang param", () => {
    expect(withLocaleParam("/pricing", "foo=bar", "en")).toBe("/pricing?foo=bar&lang=en");
  });

  it("SHOULD override an existing lang param WHEN one is already present", () => {
    expect(withLocaleParam("/pricing", "lang=fr", "en")).toBe("/pricing?lang=en");
  });
});
