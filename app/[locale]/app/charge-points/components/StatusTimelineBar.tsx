"use client";

import { useDateFormat } from "@/lib/date-format";
import { colorDotClass, type ColorName } from "@/lib/status";
import { formatDurationShort, type StatusSegment } from "@/lib/status-history";

import { Tooltip } from "../../components/common/Tooltip";

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
 * A window as one horizontal strip, one block per `StatusSegment`, sized by
 * duration and coloured from `lib/status.ts`. Generic over the status type,
 * so it serves both connection and connector status.
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
  const { formatShortDateTime } = useDateFormat();
  const totalMs = windowEnd.getTime() - windowStart.getTime();

  // Legend in order of first appearance, as a reader scans the bar.
  const legendStatuses = segments.reduce<S[]>((statuses, segment) => {
    if (segment.status !== null && !statuses.includes(segment.status))
      statuses.push(segment.status);
    return statuses;
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <div role="img" aria-label={ariaLabel} className="flex h-6 w-full rounded-md border">
        {segments.map((segment) => {
          const durationMs = segment.end.getTime() - segment.start.getTime();
          // A zero-span window fills the bar rather than divide by zero.
          const widthPercent = totalMs > 0 ? (durationMs / totalMs) * 100 : 100;
          const text = segment.status === null ? unknownLabel : label(segment.status);
          // The only place a segment's exact bounds are shown.
          const tooltipText = `${text} · ${formatShortDateTime(segment.start)} → ${formatShortDateTime(
            segment.end,
          )} (${formatDurationShort(durationMs)})`;

          return (
            <Tooltip
              key={`${segment.start.getTime()}-${segment.status ?? "unknown"}`}
              content={tooltipText}
              tabIndex={0}
              aria-label={tooltipText}
              style={{ width: `${widthPercent}%` }}
              className={
                segment.status === null
                  ? "h-full bg-muted first:rounded-l-md last:rounded-r-md focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  : `h-full first:rounded-l-md last:rounded-r-md focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${colorDotClass[toneOf(segment.status)]}`
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
