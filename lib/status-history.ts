/**
 * Turns status-transition events into the contiguous timeline a bar or a
 * duration table needs. Only transitions are recorded, so the status at
 * `windowStart` comes from the last event at or before it.
 */

type HistoryEvent<S> = { status: S; occurredAt: string };

export type StatusSegment<S> = {
  /** `null` means no event is known before this point — genuinely unknown, not a real status. */
  status: S | null;
  start: Date;
  end: Date;
};

export type StatusDuration<S> = {
  status: S;
  ms: number;
};

/**
 * The segments covering exactly `[windowStart, windowEnd)`. `events` may come
 * in any order. An event at `windowStart` seeds the first segment; one at
 * `windowEnd` is excluded. Without an event at or before `windowStart`, the
 * window opens with a `null` (unknown) segment rather than a guess.
 */
export const computeSegments = <S>(
  events: HistoryEvent<S>[],
  windowStart: Date,
  windowEnd: Date,
): StatusSegment<S>[] => {
  const startMs = windowStart.getTime();
  const endMs = windowEnd.getTime();

  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  // Only the last event at or before windowStart carries into the window.
  const seed = [...sorted]
    .reverse()
    .find((event) => new Date(event.occurredAt).getTime() <= startMs);
  const within = sorted.filter((event) => {
    const at = new Date(event.occurredAt).getTime();
    return at > startMs && at < endMs;
  });

  const timeline = seed ? [seed, ...within] : within;

  if (timeline.length === 0) {
    return [{ status: null, start: windowStart, end: windowEnd }];
  }

  const segments: StatusSegment<S>[] = [];

  const firstAt = new Date(timeline[0].occurredAt).getTime();
  if (firstAt > startMs) {
    segments.push({ status: null, start: windowStart, end: new Date(firstAt) });
  }

  timeline.forEach((event, index) => {
    const start = new Date(Math.max(new Date(event.occurredAt).getTime(), startMs));
    const next = timeline[index + 1];
    const end = next ? new Date(next.occurredAt) : windowEnd;

    // Skip zero-length segments (same-instant events).
    if (end.getTime() <= start.getTime()) return;

    segments.push({ status: event.status, start, end });
  });

  return segments;
};

/**
 * "2h30m", untranslated: it reads the same in French and English. Hours are
 * omitted under 1h; minutes always show, so 3 hours is always "3h0m".
 */
export const formatDurationShort = (ms: number): string => {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
};

/**
 * Total time per status, largest first; `null` (unknown) segments are
 * excluded.
 */
export const computeDurations = <S extends string>(
  segments: StatusSegment<S>[],
): StatusDuration<S>[] => {
  const totals = new Map<S, number>();

  for (const segment of segments) {
    if (segment.status === null) continue;
    const ms = segment.end.getTime() - segment.start.getTime();
    totals.set(segment.status, (totals.get(segment.status) ?? 0) + ms);
  }

  return Array.from(totals.entries())
    .map(([status, ms]) => ({ status, ms }))
    .sort((a, b) => b.ms - a.ms);
};
