"use client";

import cn from "classnames";
import { AlertTriangle, Check, Loader2, Minus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  FIRMWARE_UPDATE_PHASES,
  type FirmwareUpdatePhase,
  type FirmwareUpdateView,
  firmwareStatusOutcome,
  firmwareStatusPhase,
} from "@/types/firmware";

/**
 * How a phase reads on the timeline. `skipped` is its own state, not a
 * flavour of `pending`: an unsigned image never goes through SIGNATURE, and
 * a 1.6 station never reports REBOOT — showing those as "still to come" on
 * a finished update would be wrong.
 */
type PhaseState = "pending" | "active" | "done" | "failed" | "skipped";

const PHASE_ICONS: Record<PhaseState, typeof Check> = {
  pending: Minus,
  active: Loader2,
  done: Check,
  failed: X,
  skipped: Minus,
};

const PHASE_CLASSES: Record<PhaseState, string> = {
  pending: "border-border text-muted-foreground",
  active: "border-primary text-primary",
  done: "border-status-available text-status-available-foreground",
  failed: "border-destructive text-destructive",
  skipped: "border-dashed border-border text-muted-foreground/60",
};

/**
 * Works out each phase's state from the **whole** step list, never the
 * latest status alone — `firmwareStatusPhase` is not monotonic: the
 * terminal `Installed` reports on INSTALL yet arrives *after*
 * `InstallRebooting` (the station confirms install only once rebooted).
 * Reading "current phase" off the last step would show the update walking backwards.
 */
export const derivePhaseStates = (
  update: FirmwareUpdateView,
): Record<FirmwareUpdatePhase, PhaseState> => {
  const reported = new Set<FirmwareUpdatePhase>();
  let failedPhase: FirmwareUpdatePhase | null = null;

  // A historized update has no steps left (dropped on completion), so its
  // final `status` is all there is to go on.
  const statuses = update.steps?.length ? update.steps.map((step) => step.status) : [update.status];

  for (const status of statuses) {
    const phase = firmwareStatusPhase(status);
    if (!phase) continue; // `Idle` reports on no phase at all.
    reported.add(phase);
    if (firmwareStatusOutcome(status) === "FAILED") failedPhase = phase;
  }

  const latestPhase = firmwareStatusPhase(update.status);
  const finished = update.finishedAt !== null;

  return FIRMWARE_UPDATE_PHASES.reduce(
    (states, phase) => {
      if (phase === failedPhase) return { ...states, [phase]: "failed" as PhaseState };

      if (!reported.has(phase)) {
        // Never reported: skipped on a finished update (no signature to
        // verify, or a dialect that never reports reboot), or still to come on a running one.
        return { ...states, [phase]: (finished ? "skipped" : "pending") as PhaseState };
      }

      // Reported, and where the station currently is: still working on it.
      if (!finished && phase === latestPhase) {
        return { ...states, [phase]: "active" as PhaseState };
      }

      return { ...states, [phase]: "done" as PhaseState };
    },
    {} as Record<FirmwareUpdatePhase, PhaseState>,
  );
};

type FirmwareTimelineProps = {
  update: FirmwareUpdateView;
};

/**
 * The four stages of a firmware update — download, signature verification,
 * install, reboot — as a compact horizontal tracker.
 */
export const FirmwareTimeline = ({ update }: FirmwareTimelineProps) => {
  const t = useTranslations("");
  const states = derivePhaseStates(update);

  return (
    <div className="flex flex-col gap-2">
      <ol
        className="flex items-stretch gap-1"
        aria-label={t("appPage.chargePoints.firmware.timeline")}
      >
        {FIRMWARE_UPDATE_PHASES.map((phase) => {
          const state = states[phase];
          const Icon = PHASE_ICONS[state];

          return (
            <li
              key={phase}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1.5",
                PHASE_CLASSES[state],
              )}
              data-phase={phase}
              data-state={state}
            >
              <Icon className={cn("h-3.5 w-3.5", state === "active" && "animate-spin")} />
              <span className="text-center text-[10px] font-medium leading-tight">
                {t(`appPage.chargePoints.firmware.phases.${phase}`)}
              </span>
            </li>
          );
        })}
      </ol>

      {update.isStalled && (
        <div className="flex items-center gap-1.5 text-xs text-status-warning-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t("appPage.chargePoints.firmware.stalled")}
        </div>
      )}
    </div>
  );
};
