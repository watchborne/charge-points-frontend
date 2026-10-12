import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDateFormat } from "../date-format";

let mockLocale = "fr";
vi.mock("next-intl", () => ({ useLocale: () => mockLocale }));

// Built from local-time components so the assertions hold in any timezone.
const at = new Date(2026, 9, 8, 14, 5, 9);

describe("useDateFormat", () => {
  it("SHOULD format a compact day/month + time WHEN formatShortDateTime is called", () => {
    const { result } = renderHook(() => useDateFormat());

    expect(result.current.formatShortDateTime(at)).toBe("08/10 14:05");
  });

  it("SHOULD format day and month only WHEN formatDayMonth is called", () => {
    const { result } = renderHook(() => useDateFormat());

    expect(result.current.formatDayMonth(at)).toBe("08/10");
  });

  it("SHOULD format the time of day WHEN formatTime is called", () => {
    const { result } = renderHook(() => useDateFormat());

    expect(result.current.formatTime(at)).toBe("14:05");
  });

  it("SHOULD accept ISO strings and timestamps WHEN formatDateTime is called", () => {
    const { result } = renderHook(() => useDateFormat());

    expect(result.current.formatDateTime(at.toISOString())).toBe("08/10/2026 14:05");
    expect(result.current.formatDateTime(at.getTime(), { withSeconds: true })).toBe(
      "08/10/2026 14:05:09",
    );
  });

  it("SHOULD render the month name in the active locale WHEN formatDate is called", () => {
    mockLocale = "fr";
    expect(renderHook(() => useDateFormat()).result.current.formatDate(at)).toBe("08 octobre 2026");

    mockLocale = "en";
    expect(renderHook(() => useDateFormat()).result.current.formatDate(at)).toBe("08 October 2026");
  });
});
