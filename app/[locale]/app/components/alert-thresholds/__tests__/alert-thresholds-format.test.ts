import { describe, expect, it } from "vitest";

import {
  ALERT_THRESHOLD_MAX_MINUTES,
  ALERT_THRESHOLD_MIN_MINUTES,
  formValuesToPatch,
  isValidMinutes,
  minutesToMs,
  msToMinutes,
  overridesToFormValues,
  splitDuration,
} from "../alert-thresholds-format";

const FIELDS = [
  "offlineAfterMs",
  "connectorStuckUnavailableAfterMs",
  "firmwareStaleAfterMs",
] as const;

describe("bounds", () => {
  it("SHOULD express the backend's 5 minute to 7 day bounds in minutes", () => {
    expect(ALERT_THRESHOLD_MIN_MINUTES).toBe(5);
    expect(ALERT_THRESHOLD_MAX_MINUTES).toBe(10_080);
  });
});

describe("minutes conversion", () => {
  it("SHOULD round trip WHEN converting whole minutes", () => {
    expect(msToMinutes(minutesToMs(90))).toBe(90);
    expect(minutesToMs(5)).toBe(300_000);
  });
});

describe("isValidMinutes", () => {
  it.each(["", "  ", "5", "60", "10080"])("SHOULD accept %j", (value) => {
    expect(isValidMinutes(value)).toBe(true);
  });

  it.each(["4", "10081", "0", "-5", "1.5", "abc", "1e3", "60 min"])("SHOULD reject %j", (value) => {
    expect(isValidMinutes(value)).toBe(false);
  });
});

describe("splitDuration", () => {
  it.each([
    [300_000, { unit: "minutes", minutes: 5 }],
    [2_700_000, { unit: "minutes", minutes: 45 }],
    [3_600_000, { unit: "hours", hours: 1 }],
    [14_400_000, { unit: "hours", hours: 4 }],
    [16_200_000, { unit: "hoursMinutes", hours: 4, minutes: 30 }],
    [86_400_000, { unit: "days", days: 1 }],
    [604_800_000, { unit: "days", days: 7 }],
    // 25 h is not a whole number of days, so it stays in hours.
    [90_000_000, { unit: "hours", hours: 25 }],
  ])("SHOULD read %d ms in the unit it fits best", (ms, expected) => {
    expect(splitDuration(ms)).toEqual(expected);
  });
});

describe("overridesToFormValues", () => {
  it("SHOULD leave inherited fields empty and show overrides in minutes", () => {
    expect(
      overridesToFormValues(
        {
          offlineAfterMs: 7_200_000,
          connectorStuckUnavailableAfterMs: null,
          firmwareStaleAfterMs: null,
        },
        FIELDS,
      ),
    ).toEqual({
      offlineAfterMs: "120",
      connectorStuckUnavailableAfterMs: "",
      firmwareStaleAfterMs: "",
    });
  });

  it("SHOULD leave every field empty WHEN there are no overrides", () => {
    expect(Object.values(overridesToFormValues(null, FIELDS))).toEqual(["", "", ""]);
  });
});

describe("formValuesToPatch", () => {
  it("SHOULD send null for an emptied field and milliseconds for a typed one", () => {
    expect(
      formValuesToPatch(
        {
          offlineAfterMs: "120",
          connectorStuckUnavailableAfterMs: "",
          firmwareStaleAfterMs: " 45 ",
        },
        FIELDS,
      ),
    ).toEqual({
      offlineAfterMs: 7_200_000,
      connectorStuckUnavailableAfterMs: null,
      firmwareStaleAfterMs: 2_700_000,
    });
  });
});
