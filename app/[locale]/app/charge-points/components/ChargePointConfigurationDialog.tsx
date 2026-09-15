"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Input, Callout } from "@watchborne/electrons";
import { CheckCircle2, Loader2, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { SetSettingOutcome } from "@/lib/api-charge-points";
import { queryKeys } from "@/lib/queryKeys";
import { ChargePoint } from "@/types/charge-point";

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
 * Reads and sets a charge point's OCPP configuration. Self-contained: fetches
 * on open, lists the reported keys, and offers a key/value form to change one —
 * re-reading afterwards so the table reflects the change. Lets an installer
 * inspect and retune a station remotely.
 *
 * Dialect-agnostic by construction: it talks flat keys to the backend's
 * `/settings` endpoint, which dispatches GetConfiguration/ChangeConfiguration to
 * an OCPP 1.6 station and GetVariables/SetVariables to a 2.0.1 one. So this
 * component never reads `chargePoint.ocppVersion` — the station's dialect is not
 * something the UI has to know or render.
 */
export const ChargePointConfigurationDialog = ({
  chargePointId,
  chargePointName,
}: ChargePointConfigurationDialogProps) => {
  const t = useTranslations("");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [setOutcome, setSetOutcome] = useState<SetSettingOutcome | null>(null);

  const { data: outcome, isLoading: loadingOutcome } = useQuery({
    queryKey: queryKeys.settings.chargePoint(chargePointId),
    queryFn: () => api.ChargePoints.getSettings(chargePointId),
    enabled: open,
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setKey("");
      setValue("");
      setSetOutcome(null);
    }
  };

  const setSettingMutation = useMutation({
    mutationFn: () => api.ChargePoints.setSetting(chargePointId, key.trim(), value),
    onSuccess: async (outcome) => {
      setSetOutcome(outcome);
      // Re-read so the table reflects the applied change.
      if (outcome.ok)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.settings.chargePoint(chargePointId),
        });
    },
  });

  const handleSet = () => {
    if (!key.trim()) return;
    setSetOutcome(null);
    setSettingMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        {loadingOutcome && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("appPage.chargePoints.configuration.loading")}
          </div>
        )}

        {!loadingOutcome && outcome && !outcome.ok && (
          <Callout description={t(readErrorMessageKey(outcome.httpStatus))} variant="error" />
        )}

        {!loadingOutcome && outcome?.ok && (
          <div className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto">
            {(outcome.configurationKey?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("appPage.chargePoints.configuration.empty")}
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {outcome.configurationKey?.map((entry) => (
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

            {(outcome.unknownKey?.length ?? 0) > 0 && (
              <div className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.configuration.unknownKeys")}:{" "}
                <span className="font-mono">{outcome.unknownKey?.join(", ")}</span>
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
              disabled={setSettingMutation.isPending || !key.trim()}
            >
              {setSettingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("appPage.chargePoints.configuration.set.button")
              )}
            </Button>
          </div>

          {setOutcome &&
            (setOutcome.ok ? (
              <div className="flex items-center gap-2 text-sm text-status-available-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t(setSuccessMessageKey(setOutcome.status))}
              </div>
            ) : (
              <Callout description={t(setErrorMessageKey(setOutcome.httpStatus))} variant="error" />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
