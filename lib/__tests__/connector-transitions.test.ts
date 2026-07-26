import { describe, it, expect } from "vitest";

import { isExpectedConnectorTransition } from "../connector-transitions";

describe("isExpectedConnectorTransition", () => {
  it("SHOULD return true WHEN from and to are the same status", () => {
    expect(isExpectedConnectorTransition("Charging", "Charging")).toBe(true);
  });

  it("SHOULD return true WHEN the transition follows a normal charging session", () => {
    expect(isExpectedConnectorTransition("Available", "Preparing")).toBe(true);
    expect(isExpectedConnectorTransition("Preparing", "Charging")).toBe(true);
    expect(isExpectedConnectorTransition("Charging", "Finishing")).toBe(true);
    expect(isExpectedConnectorTransition("Finishing", "Available")).toBe(true);
  });

  it("SHOULD return true WHEN recovering from a fault", () => {
    expect(isExpectedConnectorTransition("Faulted", "Available")).toBe(true);
  });

  it("SHOULD return true WHEN a reservation is consumed directly into a charging session", () => {
    expect(isExpectedConnectorTransition("Reserved", "Charging")).toBe(true);
  });

  it("SHOULD return false WHEN the transition skips the recovery path", () => {
    expect(isExpectedConnectorTransition("Faulted", "Charging")).toBe(false);
  });

  it("SHOULD return false WHEN jumping between unrelated idle states without cause", () => {
    expect(isExpectedConnectorTransition("Unavailable", "Reserved")).toBe(false);
  });
});
