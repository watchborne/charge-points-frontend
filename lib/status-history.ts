/**
 * Turns a flat list of status-transition events (ADR 0008's
 * `ConnectionStateEvent`/`ConnectorStatusEvent` in `lib/api-status-history.ts`)
 * into the contiguous timeline a progress bar or a duration table actually
 * needs: what was true, and for how long, across a fixed window.
 *
 * The backend only ever records a *transition* — nothing is written while a
 * status simply continues — so a window's start rarely coincides with one.
 * Reconstructing "what was true at `windowStart`" needs the most recent event
 * at or before it, not just the ones that landed strictly inside the window.
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
 * Builds the segment list covering exactly `[windowStart, windowEnd)`.
 *
 * `events` needs no particular order coming in (the backend returns newest
 * first) — sorted here defensively rather than trusted. An event exactly at
 * `windowStart` seeds the first segment rather than opening a second one; an
 * event exactly at `windowEnd` belongs to what comes after the window and is
 * excluded, so the last segment never gets a zero-length twin.
 *
 * A window with no event at or before `windowStart` opens with one `null`
 * segment up to the first real one — a charge point that started reporting
 * partway through the window genuinely has nothing earlier to show, and
 * guessing would be worse than saying so.
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

  // The event active at windowStart is the *last* one at or before it, not
  // every one before it — only its status carries into the window.
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

    // A same-instant replay (or two events at an identical timestamp) would
    // otherwise open a zero-length segment — skip it rather than render one.
    if (end.getTime() <= start.getTime()) return;

    segments.push({ status: event.status, start, end });
  });

  return segments;
};

/**
 * "2h30m"-style, not run through `next-intl`: a numeric duration abbreviated
 * this way reads the same in French and English, so translating it would add
 * complexity (pluralization, unit words) for no legibility gain. Omits hours
 * entirely under 1h, and always shows minutes (even "0m") so "3h0m" and "3h"
 * aren't two different-looking durations for the same three hours.
 */
export const formatDurationShort = (ms: number): string => {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
};

/**
 * Reduces segments to total time per status, largest first — the dominant
 * status leads a summary the way it should. `null` (unknown) segments are
 * excluded: there is nothing to attribute that time to.
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
