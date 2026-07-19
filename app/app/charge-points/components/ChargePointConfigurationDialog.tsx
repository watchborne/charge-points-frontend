"use client";

import { Loader2, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

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
import { api } from "@/lib/api";
import { GetConfigurationOutcome } from "@/lib/api-charge-points";
import { ChargePoint } from "@/types/charge-point";

import { Callout } from "../../components/common/Callout";

type FetchState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: GetConfigurationOutcome };

const errorMessageKey = (httpStatus: number): string => {
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

type ChargePointConfigurationDialogProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
};

/**
 * Reads and displays a charge point's OCPP configuration (GetConfiguration).
 * Self-contained: fetches on open and renders the reported keys as a table, so
 * an installer can inspect a station's settings without a site visit.
 */
export const ChargePointConfigurationDialog = ({
  chargePointId,
  chargePointName,
}: ChargePointConfigurationDialogProps) => {
  const t = useTranslations("");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FetchState>({ status: "idle" });

  useEffect(() => {
    if (!open) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });
    api.ChargePoints.getConfiguration(chargePointId).then((outcome) => {
      if (!cancelled) setState({ status: "done", outcome });
    });

    return () => {
      cancelled = true;
    };
  }, [open, chargePointId]);

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
          <Callout error={t(errorMessageKey(state.outcome.httpStatus))} variant="error" />
        )}

        {state.status === "done" && state.outcome.ok && (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  );
};
