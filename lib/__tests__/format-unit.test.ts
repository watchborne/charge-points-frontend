import { describe, expect, it } from "vitest";

import { formatUnit } from "../format-unit";

describe("formatUnit", () => {
  it("SHOULD return the percent symbol WHEN the unit is Percent", () => {
    expect(formatUnit("Percent")).toBe("%");
  });

  it("SHOULD return the percent symbol WHEN the unit's casing differs", () => {
    expect(formatUnit("percent")).toBe("%");
  });

  it("SHOULD return the unit as-is WHEN it is not a percent unit", () => {
    expect(formatUnit("Wh")).toBe("Wh");
  });

  it("SHOULD return an empty string WHEN the unit is undefined", () => {
    expect(formatUnit(undefined)).toBe("");
  });
});
