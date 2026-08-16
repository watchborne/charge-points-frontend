import { describe, expect, it } from "vitest";

import { computeDurations, computeSegments, formatDurationShort } from "../status-history";

const at = (iso: string) => new Date(iso);
const event = (status: string, occurredAt: string) => ({ status, occurredAt });

const WINDOW_START = at("2026-08-10T00:00:00.000Z");
const WINDOW_END = at("2026-08-11T00:00:00.000Z");

describe("computeSegments", () => {
  it("SHOULD return one unknown segment spanning the whole window WHEN there are no events", () => {
    const segments = computeSegments([], WINDOW_START, WINDOW_END);

    expect(segments).toEqual([{ status: null, start: WINDOW_START, end: WINDOW_END }]);
  });

  it("SHOULD seed the first segment from the last event at or before windowStart", () => {
    const segments = computeSegments(
      [event("SYNCED", "2026-08-09T12:00:00.000Z")],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments).toEqual([{ status: "SYNCED", start: WINDOW_START, end: WINDOW_END }]);
  });

  it("SHOULD open an unknown segment up to the first event WHEN nothing is known before windowStart", () => {
    const firstEvent = "2026-08-10T06:00:00.000Z";
    const segments = computeSegments([event("SYNCED", firstEvent)], WINDOW_START, WINDOW_END);

    expect(segments).toEqual([
      { status: null, start: WINDOW_START, end: at(firstEvent) },
      { status: "SYNCED", start: at(firstEvent), end: WINDOW_END },
    ]);
  });

  it("SHOULD split into segments on a mid-window transition", () => {
    const seedEvent = "2026-08-09T00:00:00.000Z";
    const transitionAt = "2026-08-10T12:00:00.000Z";
    const segments = computeSegments(
      [event("Available", seedEvent), event("Charging", transitionAt)],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments).toEqual([
      { status: "Available", start: WINDOW_START, end: at(transitionAt) },
      { status: "Charging", start: at(transitionAt), end: WINDOW_END },
    ]);
  });

  it("SHOULD sort out-of-order input rather than trust the caller's ordering", () => {
    const early = "2026-08-10T06:00:00.000Z";
    const late = "2026-08-10T18:00:00.000Z";
    // Deliberately reversed, as the backend returns them (newest first).
    const segments = computeSegments(
      [event("Charging", late), event("Available", early)],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments.map((s) => s.status)).toEqual([null, "Available", "Charging"]);
  });

  it("SHOULD clamp the last segment to windowEnd, not extend past it", () => {
    const segments = computeSegments(
      [event("SYNCED", "2026-08-09T00:00:00.000Z")],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments.at(-1)?.end).toEqual(WINDOW_END);
  });

  it("SHOULD exclude an event exactly at windowEnd — it belongs to what comes after", () => {
    const segments = computeSegments(
      [event("SYNCED", "2026-08-09T00:00:00.000Z"), event("WARNING", WINDOW_END.toISOString())],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments).toEqual([{ status: "SYNCED", start: WINDOW_START, end: WINDOW_END }]);
  });

  it("SHOULD seed from windowStart itself rather than opening a redundant unknown segment", () => {
    const segments = computeSegments(
      [event("SYNCED", WINDOW_START.toISOString())],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments).toEqual([{ status: "SYNCED", start: WINDOW_START, end: WINDOW_END }]);
  });

  it("SHOULD only use the most recent event before windowStart as the seed, not every one", () => {
    const segments = computeSegments(
      [
        event("Preparing", "2026-08-01T00:00:00.000Z"),
        event("Available", "2026-08-09T00:00:00.000Z"),
      ],
      WINDOW_START,
      WINDOW_END,
    );

    expect(segments).toEqual([{ status: "Available", start: WINDOW_START, end: WINDOW_END }]);
  });
});

describe("computeDurations", () => {
  it("SHOULD sum time per status, excluding unknown segments", () => {
    const durations = computeDurations([
      { status: null, start: at("2026-08-10T00:00:00.000Z"), end: at("2026-08-10T06:00:00.000Z") },
      {
        status: "Available",
        start: at("2026-08-10T06:00:00.000Z"),
        end: at("2026-08-10T10:00:00.000Z"),
      },
      {
        status: "Charging",
        start: at("2026-08-10T10:00:00.000Z"),
        end: at("2026-08-10T12:00:00.000Z"),
      },
    ]);

    expect(durations).toEqual([
      { status: "Available", ms: 4 * 60 * 60 * 1000 },
      { status: "Charging", ms: 2 * 60 * 60 * 1000 },
    ]);
  });

  it("SHOULD merge non-adjacent segments of the same status", () => {
    const durations = computeDurations([
      {
        status: "Available",
        start: at("2026-08-10T00:00:00.000Z"),
        end: at("2026-08-10T01:00:00.000Z"),
      },
      {
        status: "Charging",
        start: at("2026-08-10T01:00:00.000Z"),
        end: at("2026-08-10T02:00:00.000Z"),
      },
      {
        status: "Available",
        start: at("2026-08-10T02:00:00.000Z"),
        end: at("2026-08-10T04:00:00.000Z"),
      },
    ]);

    expect(durations).toEqual([
      { status: "Available", ms: 3 * 60 * 60 * 1000 },
      { status: "Charging", ms: 1 * 60 * 60 * 1000 },
    ]);
  });

  it("SHOULD order by descending duration, largest first", () => {
    const durations = computeDurations([
      { status: "A", start: at("2026-08-10T00:00:00.000Z"), end: at("2026-08-10T01:00:00.000Z") },
      { status: "B", start: at("2026-08-10T01:00:00.000Z"), end: at("2026-08-10T05:00:00.000Z") },
    ]);

    expect(durations.map((d) => d.status)).toEqual(["B", "A"]);
  });

  it("SHOULD return an empty list WHEN every segment is unknown", () => {
    expect(
      computeDurations([
        {
          status: null,
          start: at("2026-08-10T00:00:00.000Z"),
          end: at("2026-08-11T00:00:00.000Z"),
        },
      ]),
    ).toEqual([]);
  });
});

describe("formatDurationShort", () => {
  it("SHOULD omit hours entirely under 1h", () => {
    expect(formatDurationShort(5 * 60_000)).toBe("5m");
  });

  it("SHOULD always show minutes, even a whole number of hours", () => {
    expect(formatDurationShort(3 * 60 * 60_000)).toBe("3h0m");
  });

  it("SHOULD show both hours and minutes together", () => {
    expect(formatDurationShort(2 * 60 * 60_000 + 30 * 60_000)).toBe("2h30m");
  });

  it("SHOULD round to the nearest minute", () => {
    expect(formatDurationShort(90_000)).toBe("2m"); // 1.5 minutes
  });
});
