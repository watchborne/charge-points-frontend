import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDateFormat } from "../date-format";

let mockLocale = "fr";
vi.mock("next-intl", () => ({ useLocale: () => mockLocale }));

// Built from local-time components so the assertions hold in any timezone.
const at = new Date(2026, 9, 8, 14, 5, 9);

const format = (locale: string) => {
  mockLocale = locale;
  return renderHook(() => useDateFormat()).result.current;
};

describe("useDateFormat", () => {
  describe("WHEN the locale is fr", () => {
    it("SHOULD format a numeric date and time", () => {
      expect(format("fr").formatDateTime(at)).toBe("08/10/2026 14:05");
    });

    it("SHOULD add the seconds WHEN withSeconds is set", () => {
      expect(format("fr").formatDateTime(at, { withSeconds: true })).toBe("08/10/2026 14:05:09");
    });

    it("SHOULD format a numeric date only", () => {
      expect(format("fr").formatDateNumeric(at)).toBe("08/10/2026");
    });

    it("SHOULD spell the month out WHEN formatDate is called", () => {
      expect(format("fr").formatDate(at)).toBe("08 octobre 2026");
    });

    it("SHOULD format the compact variants", () => {
      const fr = format("fr");

      expect(fr.formatTime(at)).toBe("14:05");
      expect(fr.formatShortDateTime(at)).toBe("08/10 14:05");
      expect(fr.formatDayMonth(at)).toBe("08/10");
    });
  });

  describe("WHEN the locale is en", () => {
    it("SHOULD follow the English conventions: month first, 12-hour clock", () => {
      const en = format("en");

      expect(en.formatDateTime(at)).toMatch(/^10\/08\/2026, 0?2:05 PM$/);
      expect(en.formatDateNumeric(at)).toBe("10/08/2026");
      expect(en.formatDayMonth(at)).toBe("10/08");
      expect(en.formatTime(at)).toMatch(/^0?2:05 PM$/);
    });

    it("SHOULD spell the month out in English WHEN formatDate is called", () => {
      expect(format("en").formatDate(at)).toMatch(/October 0?8, 2026/);
    });
  });

  it("SHOULD accept ISO strings and timestamps", () => {
    const fr = format("fr");

    expect(fr.formatDateTime(at.toISOString())).toBe("08/10/2026 14:05");
    expect(fr.formatDateTime(at.getTime())).toBe("08/10/2026 14:05");
  });

  it("SHOULD fall back to French WHEN the locale is unknown", () => {
    expect(format("de").formatDateNumeric(at)).toBe("08/10/2026");
  });

  it("SHOULD describe the distance to now WHEN formatRelative is called", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    expect(format("fr").formatRelative(threeHoursAgo)).toBe("il y a environ 3 heures");
    expect(format("en").formatRelative(threeHoursAgo)).toBe("about 3 hours ago");
  });
});
