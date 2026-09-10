"use client";

import { MESSAGE_PRIORITIES_V201, type MessagePriorityV201 } from "@watchborne/charge-points-types";
import { Button, Callout, Input, Label } from "@watchborne/electrons";
import { CheckCircle2, FileText, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { ClearDisplayMessageOutcome, SetDisplayMessageOutcome } from "@/lib/api-charge-points";
import type { ChargePoint } from "@/types/charge-point";

/**
 * The one message slot this control manages. `GetDisplayMessages` (reading
 * back what a station is actually showing) is a separate backend fast-follow
 * this UI does not consume yet, so there is no way to discover a station's
 * own message ids here — this control always targets a single, fixed one
 * instead: sending overwrites whatever occupies it, clearing removes it. A
 * message set through another channel (a different CSMS, the station's own
 * default) uses a different id and is unaffected either way.
 */
const DISPLAY_MESSAGE_ID = 1;

type SetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: SetDisplayMessageOutcome };

type ClearState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ClearDisplayMessageOutcome };

const SET_RESULT_KEY_BY_STATUS = {
  Accepted: "appPage.chargePoints.displayMessage.set.result.accepted",
  Rejected: "appPage.chargePoints.displayMessage.set.result.rejected",
  NotSupportedMessageFormat:
    "appPage.chargePoints.displayMessage.set.result.notSupportedMessageFormat",
  NotSupportedPriority: "appPage.chargePoints.displayMessage.set.result.notSupportedPriority",
  NotSupportedState: "appPage.chargePoints.displayMessage.set.result.notSupportedState",
  UnknownTransaction: "appPage.chargePoints.displayMessage.set.result.unknownTransaction",
} as const;

const setErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.displayMessage.set.result.notFound";
    case 409:
      return "appPage.chargePoints.displayMessage.set.result.notConnectedOrUnsupported";
    case 502:
      return "appPage.chargePoints.displayMessage.set.result.stationError";
    case 504:
      return "appPage.chargePoints.displayMessage.set.result.timeout";
    default:
      return "appPage.chargePoints.displayMessage.set.result.genericError";
  }
};

const setResultKey = (outcome: SetDisplayMessageOutcome): string =>
  outcome.ok ? SET_RESULT_KEY_BY_STATUS[outcome.status] : setErrorMessageKey(outcome.httpStatus);

const clearErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.displayMessage.clear.result.notFound";
    case 409:
      return "appPage.chargePoints.displayMessage.clear.result.notConnectedOrUnsupported";
    case 502:
      return "appPage.chargePoints.displayMessage.clear.result.stationError";
    case 504:
      return "appPage.chargePoints.displayMessage.clear.result.timeout";
    default:
      return "appPage.chargePoints.displayMessage.clear.result.genericError";
  }
};

type DisplayMessageControlProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * Lets an installer push a free-text message to a station's physical display
 * (OCPP `SetDisplayMessage`) or remove it (`ClearDisplayMessage`) — 2.0.1
 * only: this component only ever renders inside `ChargePointActionsSection`,
 * itself gated on `ocppVersion === "2.0.1"`.
 *
 * The station's own rejection (`Rejected`/`NotSupported*`/`UnknownTransaction`
 * for Set, `Unknown` for Clear) still answers HTTP 200 — the request itself
 * succeeded, the station declined the content — so success here means the
 * station's own `status` was `Accepted`, not merely a 2xx response.
 */
export const DisplayMessageControl = ({ chargePointId }: DisplayMessageControlProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<MessagePriorityV201>("NormalCycle");
  const [setState, setSetState] = useState<SetState>({ status: "idle" });
  const [clearState, setClearState] = useState<ClearState>({ status: "idle" });

  const resetDialog = () => {
    setContent("");
    setPriority("NormalCycle");
    setSetState({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetDialog();
  };

  const handleSend = async () => {
    setSetState({ status: "loading" });

    const outcome = await api.ChargePoints.setDisplayMessage(chargePointId, {
      id: DISPLAY_MESSAGE_ID,
      priority,
      content,
    });

    setSetState({ status: "done", outcome });
  };

  const handleClear = async () => {
    setClearState({ status: "loading" });
    const outcome = await api.ChargePoints.clearDisplayMessage(chargePointId, DISPLAY_MESSAGE_ID);
    setClearState({ status: "done", outcome });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="mr-1.5 h-4 w-4" />
              {t("appPage.chargePoints.displayMessage.set.button")}
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("appPage.chargePoints.displayMessage.set.title")}</DialogTitle>
              <DialogDescription>
                {t("appPage.chargePoints.displayMessage.set.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display-message-content">
                  {t("appPage.chargePoints.displayMessage.set.fields.content")}
                </Label>
                <Input
                  id="display-message-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display-message-priority">
                  {t("appPage.chargePoints.displayMessage.set.fields.priority")}
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as MessagePriorityV201)}
                >
                  <SelectTrigger id="display-message-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_PRIORITIES_V201.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`appPage.chargePoints.displayMessage.set.priorities.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {setState.status === "done" &&
                (setState.outcome.ok && setState.outcome.status === "Accepted" ? (
                  <div className="flex items-center gap-2 text-sm text-status-available-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {t(SET_RESULT_KEY_BY_STATUS.Accepted)}
                  </div>
                ) : (
                  <Callout description={t(setResultKey(setState.outcome))} variant="error" />
                ))}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                {t("appPage.chargePoints.displayMessage.set.close")}
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={content.trim().length === 0 || setState.status === "loading"}
              >
                {setState.status === "loading" && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {t("appPage.chargePoints.displayMessage.set.submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={clearState.status === "loading"}
        >
          {clearState.status === "loading" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-1.5 h-4 w-4" />
          )}
          {t("appPage.chargePoints.displayMessage.clear.button")}
        </Button>
      </div>

      {clearState.status === "done" &&
        (clearState.outcome.ok ? (
          clearState.outcome.status === "Accepted" ? (
            <div className="flex items-center gap-2 text-sm text-status-available-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t("appPage.chargePoints.displayMessage.clear.result.accepted")}
            </div>
          ) : (
            // `Unknown` means no message with this id exists on the station — a
            // normal, expected outcome (e.g. it already expired), not an error.
            <Callout
              description={t("appPage.chargePoints.displayMessage.clear.result.unknown")}
              variant="info"
            />
          )
        ) : (
          <Callout
            description={t(clearErrorMessageKey(clearState.outcome.httpStatus))}
            variant="error"
          />
        ))}
    </div>
  );
};
