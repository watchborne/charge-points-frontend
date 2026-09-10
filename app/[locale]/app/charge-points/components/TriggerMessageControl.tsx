"use client";

import { TriggerMessageType } from "@watchborne/charge-points-types";
import { Button, Callout } from "@watchborne/electrons";
import { CheckCircle2, ChevronDown, Loader2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { TriggerMessageOutcome } from "@/lib/api-charge-points";
import { ChargePoint } from "@/types/charge-point";

import { ActionsDropdown } from "../../components/common/ActionsDropdown";

type TriggerState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: TriggerMessageOutcome };

const errorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.trigger.result.notFound";
    case 409:
      return "appPage.chargePoints.trigger.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.trigger.result.stationError";
    case 504:
      return "appPage.chargePoints.trigger.result.timeout";
    default:
      return "appPage.chargePoints.trigger.result.genericError";
  }
};

type TriggerMessageControlProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * The `requestedMessage` values the backend can actually act on — narrower
 * than `@watchborne/charge-points-types`' `TRIGGER_MESSAGE_TYPES`, which is
 * the full per-dialect OCPP wire vocabulary. Mirrors
 * `SUPPORTED_TRIGGER_MESSAGE_TYPES` in charge-points-server's
 * `src/application/ports/trigger-message-vocabulary.ts`: the server has no
 * handler for the rest and its REST schema rejects them outright (400), so
 * offering them here would just be a dead-end button.
 */
const SUPPORTED_TRIGGER_MESSAGE_TYPES: readonly TriggerMessageType[] = [
  "BootNotification",
  "Heartbeat",
  "StatusNotification",
  "MeterValues",
  "FirmwareStatusNotification",
];

/**
 * Asks a charge point to (re)send a message (TriggerMessage) — a whole-station
 * "poke" to force a StatusNotification/BootNotification and re-sync live state
 * without waiting. Self-contained: dispatches via `api` directly.
 */
export const TriggerMessageControl = ({ chargePointId }: TriggerMessageControlProps) => {
  const t = useTranslations("");
  const [state, setState] = useState<TriggerState>({ status: "idle" });

  const handleTrigger = async (requestedMessage: TriggerMessageType) => {
    setState({ status: "loading" });
    const outcome = await api.ChargePoints.triggerMessage(chargePointId, requestedMessage);
    setState({ status: "done", outcome });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center">
        {state.status === "loading" ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Radio className="mr-1.5 h-4 w-4" />
        )}
        <label className="text-sm font-medium">{t("appPage.chargePoints.trigger.label")}</label>
      </div>
      <div className="flex flex-col gap-2">
        <ActionsDropdown
          align="start"
          disabled={state.status === "loading"}
          trigger={
            <Button variant="outline" size="sm" disabled={state.status === "loading"}>
              {t("appPage.chargePoints.trigger.button")}
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          }
          actions={SUPPORTED_TRIGGER_MESSAGE_TYPES.map((type) => ({
            id: type,
            label: t(`appPage.chargePoints.trigger.types.${type}`),
          }))}
          onAction={(actionId) => handleTrigger(actionId as TriggerMessageType)}
        />

        {state.status === "done" &&
          (state.outcome.ok ? (
            <div className="flex items-center gap-2 text-sm text-status-available-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t("appPage.chargePoints.trigger.result.accepted")}
            </div>
          ) : (
            <Callout description={t(errorMessageKey(state.outcome.httpStatus))} variant="error" />
          ))}
      </div>
    </div>
  );
};
