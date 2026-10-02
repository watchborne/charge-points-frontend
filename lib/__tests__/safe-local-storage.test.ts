import { afterEach, describe, expect, it, vi } from "vitest";

import { safeLocalStorage } from "../safe-local-storage";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("safeLocalStorage", () => {
  it("SHOULD round-trip a value WHEN storage is available", () => {
    safeLocalStorage.setItem("key", "value");

    expect(safeLocalStorage.getItem("key")).toBe("value");
  });

  it("SHOULD return null WHEN the key was never stored", () => {
    expect(safeLocalStorage.getItem("missing")).toBeNull();
  });

  it("SHOULD return null instead of throwing WHEN reading storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    expect(safeLocalStorage.getItem("key")).toBeNull();
  });

  it("SHOULD NOT throw WHEN writing storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(() => safeLocalStorage.setItem("key", "value")).not.toThrow();
  });
});
