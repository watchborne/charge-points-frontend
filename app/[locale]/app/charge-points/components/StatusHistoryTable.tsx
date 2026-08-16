"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { format } from "date-fns";

import { toneBadgeClass, toneDotClass, type StatusTone } from "@/lib/status";
import { computeDurations, formatDurationShort, type StatusSegment } from "@/lib/status-history";

type Props<S extends string> = {
  segments: StatusSegment<S>[];
  toneOf: (status: S) => StatusTone;
  label: (status: S) => string;
  unknownLabel: string;
  timestampHeader: string;
  statusHeader: string;
  durationHeader: string;
};

/**
 * The 30-day tier's read: a total-time-per-status summary above a
 * chronological breakdown, newest first (matching `ChargePointConsumptionPanel`'s
 * table view — the latest entry is the interesting one). Where
 * `StatusTimelineBar` answers "what does today look like", this answers "how
 * much of the last month was each status, and when".
 */
export const StatusHistoryTable = <S extends string>({
  segments,
  toneOf,
  label,
  unknownLabel,
  timestampHeader,
  statusHeader,
  durationHeader,
}: Props<S>) => {
  const durations = computeDurations(segments);

  return (
    <div className="flex flex-col gap-2">
      {durations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {durations.map(({ status, ms }) => (
            <span
              key={status}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${toneBadgeClass[toneOf(status)]}`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${toneDotClass[toneOf(status)]}`}
              />
              {label(status)} · {formatDurationShort(ms)}
            </span>
          ))}
        </div>
      )}

      <div className="max-h-[220px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">{timestampHeader}</TableHead>
              <TableHead className="text-xs">{statusHeader}</TableHead>
              <TableHead className="text-right text-xs">{durationHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Newest first, the opposite of the bar's left-to-right axis. */}
            {[...segments].reverse().map((segment) => (
              <TableRow key={`${segment.start.getTime()}-${segment.status ?? "unknown"}`}>
                <TableCell className="text-xs">
                  {format(segment.start, "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    {segment.status !== null && (
                      <span
                        aria-hidden
                        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${toneDotClass[toneOf(segment.status)]}`}
                      />
                    )}
                    {segment.status === null ? unknownLabel : label(segment.status)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatDurationShort(segment.end.getTime() - segment.start.getTime())}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
