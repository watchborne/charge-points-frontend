import { describe, expect, it } from "vitest";

import { centsToPrice, priceToCents } from "../tariff-price";

describe("priceToCents", () => {
  it.each([
    [0.2142, 21.42],
    [0.25, 25],
    [0.0001, 0.01],
    [0.29, 29],
    [0, 0],
  ])("SHOULD convert %s per kWh to %s cents WHEN submitting", (price, cents) => {
    expect(priceToCents(price)).toBe(cents);
  });

  it("SHOULD round to 4 decimals WHEN the input is finer", () => {
    expect(priceToCents(0.21424)).toBe(21.42);
  });
});

describe("centsToPrice", () => {
  it.each([
    [21.42, 0.2142],
    [25, 0.25],
    [0.01, 0.0001],
    [7.07, 0.0707],
  ])("SHOULD convert %s cents to %s per kWh WHEN displaying", (cents, price) => {
    expect(centsToPrice(cents)).toBe(price);
  });
});
