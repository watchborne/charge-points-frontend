"use client";

import {
  GET_BASE_REPORT_TYPES_V201,
  type GetBaseReportBaseV201,
} from "@watchborne/charge-points-types";
import { Button, Callout, Label } from "@watchborne/electrons";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
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
import type { RequestDeviceReportOutcome } from "@/lib/api-device-variable-reports";
import type { ChargePoint } from "@/types/charge-point";

type ReportKind = "base" | "full";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: RequestDeviceReportOutcome };

const errorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 400:
      return "appPage.chargePoints.deviceVariableReports.request.result.invalidRequest";
    case 404:
      return "appPage.chargePoints.deviceVariableReports.request.result.notFound";
    case 409:
      return "appPage.chargePoints.deviceVariableReports.request.result.notConnectedOrBusy";
    case 502:
      return "appPage.chargePoints.deviceVariableReports.request.result.stationError";
    case 504:
      return "appPage.chargePoints.deviceVariableReports.request.result.timeout";
    default:
      return "appPage.chargePoints.deviceVariableReports.request.result.genericError";
  }
};

type RequestDeviceReportDialogProps = {
  chargePointId: ChargePoint["id"];
  onRequested: () => void;
};

/**
 * Lets an installer ask a station for its device-model inventory — OCPP
 * `GetBaseReport` (a chosen flavor) or `GetReport` (everything, unfiltered —
 * component/variable filtering isn't exposed yet, charge-points-server ADR
 * 0014 decision 6). 2.0.1-only: this dialog only ever renders inside
 * `DeviceVariableReportsPanel`, itself gated on `ocppVersion === "2.0.1"` by
 * `ChargePointDetailPanel`.
 *
 * The station's reply is only an acknowledgment — `Accepted`/`Rejected`/
 * `NotSupported`/`EmptyResultSet` — never the report itself. The actual
 * inventory arrives later, out of band, as one or more `NotifyReport`
 * frames; `onRequested` re-fetches the panel's history so a report that
 * already landed shows up, though a slow station may need another look
 * later.
 */
export const RequestDeviceReportDialog = ({
  chargePointId,
  onRequested,
}: RequestDeviceReportDialogProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ReportKind>("full");
  const [reportBase, setReportBase] = useState<GetBaseReportBaseV201>("FullInventory");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const reset = () => {
    setKind("full");
    setReportBase("FullInventory");
    setState({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    setState({ status: "loading" });

    const outcome =
      kind === "base"
        ? await api.DeviceVariableReports.requestBaseReport(chargePointId, reportBase)
        : await api.DeviceVariableReports.requestReport(chargePointId);

    setState({ status: "done", outcome });
    if (outcome.ok) onRequested();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardList className="mr-1.5 h-4 w-4" />
          {t("appPage.chargePoints.deviceVariableReports.request.button")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("appPage.chargePoints.deviceVariableReports.request.title")}</DialogTitle>
          <DialogDescription>
            {t("appPage.chargePoints.deviceVariableReports.request.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="device-report-kind">
              {t("appPage.chargePoints.deviceVariableReports.request.fields.kind")}
            </Label>
            <Select value={kind} onValueChange={(value) => setKind(value as ReportKind)}>
              <SelectTrigger id="device-report-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">
                  {t("appPage.chargePoints.deviceVariableReports.request.kinds.full")}
                </SelectItem>
                <SelectItem value="base">
                  {t("appPage.chargePoints.deviceVariableReports.request.kinds.base")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "base" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="device-report-base">
                {t("appPage.chargePoints.deviceVariableReports.request.fields.reportBase")}
              </Label>
              <Select
                value={reportBase}
                onValueChange={(value) => setReportBase(value as GetBaseReportBaseV201)}
              >
                <SelectTrigger id="device-report-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GET_BASE_REPORT_TYPES_V201.map((base) => (
                    <SelectItem key={base} value={base}>
                      {t(`appPage.chargePoints.deviceVariableReports.request.reportBases.${base}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {state.status === "done" &&
            (state.outcome.ok ? (
              <div className="flex items-center gap-2 text-sm text-status-available-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {state.outcome.status === "EmptyResultSet"
                  ? t("appPage.chargePoints.deviceVariableReports.request.result.emptyResultSet")
                  : t("appPage.chargePoints.deviceVariableReports.request.result.accepted")}
              </div>
            ) : (
              <Callout description={t(errorMessageKey(state.outcome.httpStatus))} variant="error" />
            ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            {t("appPage.chargePoints.deviceVariableReports.request.close")}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={state.status === "loading"}>
            {state.status === "loading" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("appPage.chargePoints.deviceVariableReports.request.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
