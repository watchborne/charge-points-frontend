"use client";

import { TRIGGER_MESSAGE_TYPES, TriggerMessageType } from "@watchborne/charge-points-types";
import { CheckCircle2, ChevronDown, Loader2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { TriggerMessageOutcome } from "@/lib/api-charge-points";
import { ChargePoint } from "@/types/charge-point";

import { Callout } from "../../components/common/Callout";

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
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={state.status === "loading"}>
            {state.status === "loading" ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Radio className="mr-1.5 h-4 w-4" />
            )}
            {t("appPage.chargePoints.trigger.button")}
            <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {TRIGGER_MESSAGE_TYPES.map((type) => (
            <DropdownMenuItem key={type} onClick={() => handleTrigger(type)}>
              {t(`appPage.chargePoints.trigger.types.${type}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
  );
};
