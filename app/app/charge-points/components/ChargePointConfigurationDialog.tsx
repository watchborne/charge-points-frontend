"use client";

import { CheckCircle2, Loader2, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ChangeConfigurationOutcome, GetConfigurationOutcome } from "@/lib/api-charge-points";
import { ChargePoint } from "@/types/charge-point";

import { Callout } from "../../components/common/Callout";

type FetchState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: GetConfigurationOutcome };

type SetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ChangeConfigurationOutcome };

const readErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.configuration.result.notFound";
    case 409:
      return "appPage.chargePoints.configuration.result.notConnected";
    case 502:
      return "appPage.chargePoints.configuration.result.stationError";
    case 504:
      return "appPage.chargePoints.configuration.result.timeout";
    default:
      return "appPage.chargePoints.configuration.result.genericError";
  }
};

const setErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.configuration.set.result.notFound";
    case 409:
      return "appPage.chargePoints.configuration.set.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.configuration.set.result.stationError";
    case 504:
      return "appPage.chargePoints.configuration.set.result.timeout";
    default:
      return "appPage.chargePoints.configuration.set.result.genericError";
  }
};

const setSuccessMessageKey = (status: string): string =>
  status === "RebootRequired"
    ? "appPage.chargePoints.configuration.set.result.rebootRequired"
    : "appPage.chargePoints.configuration.set.result.accepted";

type ChargePointConfigurationDialogProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
};

/**
 * Reads (GetConfiguration) and sets (ChangeConfiguration) a charge point's OCPP
 * configuration. Self-contained: fetches on open, lists the reported keys, and
 * offers a key/value form to change one — re-reading afterwards so the table
 * reflects the change. Lets an installer inspect and retune a station remotely.
 */
export const ChargePointConfigurationDialog = ({
  chargePointId,
  chargePointName,
}: ChargePointConfigurationDialogProps) => {
  const t = useTranslations("");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [setState_, setSetState] = useState<SetState>({ status: "idle" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const outcome = await api.ChargePoints.getConfiguration(chargePointId);
    setState({ status: "done", outcome });
  }, [chargePointId]);

  useEffect(() => {
    if (!open) {
      setState({ status: "idle" });
      setKey("");
      setValue("");
      setSetState({ status: "idle" });
      return;
    }

    void load();
  }, [open, load, chargePointId]);

  const handleSet = async () => {
    if (!key.trim()) return;
    setSetState({ status: "loading" });
    const outcome = await api.ChargePoints.changeConfiguration(chargePointId, key.trim(), value);
    setSetState({ status: "done", outcome });
    // Re-read so the table reflects the applied change.
    if (outcome.ok) await load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-1.5 h-4 w-4" />
          {t("appPage.chargePoints.configuration.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("appPage.chargePoints.configuration.title")}</DialogTitle>
          <DialogDescription>
            {t("appPage.chargePoints.configuration.description", { name: chargePointName })}
          </DialogDescription>
        </DialogHeader>

        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("appPage.chargePoints.configuration.loading")}
          </div>
        )}

        {state.status === "done" && !state.outcome.ok && (
          <Callout description={t(readErrorMessageKey(state.outcome.httpStatus))} variant="error" />
        )}

        {state.status === "done" && state.outcome.ok && (
          <div className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto">
            {(state.outcome.configurationKey?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("appPage.chargePoints.configuration.empty")}
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {state.outcome.configurationKey?.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-sm">{entry.key}</span>
                      {entry.readonly && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {t("appPage.chargePoints.configuration.readonly")}
                        </Badge>
                      )}
                    </div>
                    <span className="max-w-[45%] truncate text-right font-mono text-sm text-muted-foreground">
                      {entry.value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(state.outcome.unknownKey?.length ?? 0) > 0 && (
              <div className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.configuration.unknownKeys")}:{" "}
                <span className="font-mono">{state.outcome.unknownKey?.join(", ")}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t("appPage.chargePoints.configuration.set.title")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t("appPage.chargePoints.configuration.set.keyPlaceholder")}
              className="font-mono"
            />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("appPage.chargePoints.configuration.set.valuePlaceholder")}
              className="font-mono"
            />
            <Button
              size="sm"
              onClick={handleSet}
              disabled={setState_.status === "loading" || !key.trim()}
            >
              {setState_.status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("appPage.chargePoints.configuration.set.button")
              )}
            </Button>
          </div>

          {setState_.status === "done" &&
            (setState_.outcome.ok ? (
              <div className="flex items-center gap-2 text-sm text-status-available-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t(setSuccessMessageKey(setState_.outcome.status))}
              </div>
            ) : (
              <Callout
                description={t(setErrorMessageKey(setState_.outcome.httpStatus))}
                variant="error"
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
