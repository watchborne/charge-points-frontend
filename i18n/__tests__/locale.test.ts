import { describe, expect, it } from "vitest";

import { localeForHost } from "../locale";

describe("localeForHost", () => {
  it("SHOULD return fr WHEN the host is a .fr domain", () => {
    expect(localeForHost("watch-borne.fr")).toBe("fr");
  });

  it("SHOULD return en WHEN the host is a .com domain", () => {
    expect(localeForHost("watch-borne.com")).toBe("en");
  });

  it("SHOULD return en WHEN the host is an app.* .com subdomain", () => {
    expect(localeForHost("app.watch-borne.com")).toBe("en");
  });

  it("SHOULD return the default locale WHEN the host matches neither TLD", () => {
    expect(localeForHost("localhost:3001")).toBe("fr");
    expect(localeForHost("watchborne.netlify.app")).toBe("fr");
  });
});
