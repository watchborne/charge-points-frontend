"use client";

import { format } from "date-fns";

import { colorDotClass, type ColorName } from "@/lib/status";
import { formatDurationShort, type StatusSegment } from "@/lib/status-history";

type Props<S extends string> = {
  segments: StatusSegment<S>[];
  windowStart: Date;
  windowEnd: Date;
  toneOf: (status: S) => ColorName;
  /** Renders a status value as display text — the caller's translation, not this component's. */
  label: (status: S) => string;
  /** Names the whole bar for a screen reader — the segments are an SVG-less colour strip it can't otherwise narrate. */
  ariaLabel: string;
  /** Display text for a `null` (no-data) segment. */
  unknownLabel: string;
};

/**
 * A window rendered as a single horizontal strip, one flex-sized block per
 * `StatusSegment` — width proportional to how long that status held, colour
 * from the shared tone maps in `lib/status.ts` so this reads consistently
 * with every other status indicator in the app.
 *
 * Generic over the status type so one component serves both connection
 * state (`lib/status.ts`'s `connectionStatusColor`) and connector status
 * (`connectorStatusColor`) — `StatusHistoryPanel` supplies which.
 */
export const StatusTimelineBar = <S extends string>({
  segments,
  windowStart,
  windowEnd,
  toneOf,
  label,
  ariaLabel,
  unknownLabel,
}: Props<S>) => {
  const totalMs = windowEnd.getTime() - windowStart.getTime();

  // Unique statuses in the order they first appear — a reader scanning the
  // bar left to right meets each colour's meaning in the order they see it,
  // rather than a legend order unrelated to what's actually shown.
  const legendStatuses = segments.reduce<S[]>((statuses, segment) => {
    if (segment.status !== null && !statuses.includes(segment.status))
      statuses.push(segment.status);
    return statuses;
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex h-6 w-full overflow-hidden rounded-md border"
      >
        {segments.map((segment) => {
          const durationMs = segment.end.getTime() - segment.start.getTime();
          // A window with zero span (shouldn't happen — windowEnd is always
          // after windowStart) falls back to filling the bar rather than
          // dividing by zero.
          const widthPercent = totalMs > 0 ? (durationMs / totalMs) * 100 : 100;
          const text = segment.status === null ? unknownLabel : label(segment.status);

          return (
            <div
              key={`${segment.start.getTime()}-${segment.status ?? "unknown"}`}
              style={{ width: `${widthPercent}%` }}
              // Native tooltip: the one place the exact bounds are reachable
              // without a legend entry for every segment individually.
              title={`${text} · ${format(segment.start, "dd/MM HH:mm")} → ${format(
                segment.end,
                "dd/MM HH:mm",
              )} (${formatDurationShort(durationMs)})`}
              className={
                segment.status === null
                  ? "h-full bg-muted"
                  : `h-full ${colorDotClass[toneOf(segment.status)]}`
              }
            />
          );
        })}
      </div>

      {legendStatuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {legendStatuses.map((status) => (
            <span
              key={status}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                aria-hidden
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${colorDotClass[toneOf(status)]}`}
              />
              {label(status)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
