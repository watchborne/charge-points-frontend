"use client";

import { GET_LOG_TYPES_V201, type GetLogTypeV201 } from "@watchborne/charge-points-types";
import { Button, Callout, Input, Label } from "@watchborne/electrons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@watchborne/electrons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@watchborne/electrons";
import { CheckCircle2, FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import type { StartLogUploadOutcome } from "@/lib/api-log-uploads";
import type { ChargePoint } from "@/types/charge-point";

type SubmitState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: StartLogUploadOutcome };

/** Schemes a station actually uploads to. Mirrors the backend. */
const ALLOWED_PROTOCOLS = ["http:", "https:", "ftp:", "ftps:"];

/**
 * The same allowlist as `UpdateFirmwareDialog`; the server stays
 * authoritative.
 */
const isAcceptableLocation = (value: string): boolean => {
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const errorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 400:
      return "appPage.chargePoints.logUpload.start.result.invalidRequest";
    case 404:
      return "appPage.chargePoints.logUpload.start.result.notFound";
    case 409:
      return "appPage.chargePoints.logUpload.start.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.logUpload.start.result.stationError";
    case 504:
      return "appPage.chargePoints.logUpload.start.result.timeout";
    default:
      return "appPage.chargePoints.logUpload.start.result.genericError";
  }
};

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
const toIsoOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : new Date(value).toISOString();

type StartLogUploadDialogProps = {
  chargePointId: ChargePoint["id"];
  /** `SecurityLog` has no 1.6 equivalent. */
  ocppVersion: ChargePoint["ocppVersion"];
  /** Refuses upfront when the station already has an upload running. */
  uploadInProgress: boolean;
  /** The charge point is deactivated: no command may be sent to it. */
  disabled?: boolean;
  onStarted: () => void;
};

/**
 * Requests a remote log bundle (`GetDiagnostics` on 1.6, `GetLog` on 2.0.1).
 * A 1.6 station only acknowledges, so a `null` status reads "requested", not
 * "accepted"; the outcome arrives through the upload's status.
 */
export const StartLogUploadDialog = ({
  chargePointId,
  ocppVersion,
  uploadInProgress,
  disabled = false,
  onStarted,
}: StartLogUploadDialogProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [logType, setLogType] = useState<GetLogTypeV201>("DiagnosticsLog");
  const [remoteLocation, setRemoteLocation] = useState("");
  const [oldestTimestamp, setOldestTimestamp] = useState("");
  const [latestTimestamp, setLatestTimestamp] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  // 1.6's GetDiagnostics has no log type: there is only one bundle.
  const supportsSecurityLog = ocppVersion === "2.0.1";
  const locationIsValid = remoteLocation.length > 0 && isAcceptableLocation(remoteLocation);
  const canSubmit = locationIsValid && state.status !== "loading";

  const reset = () => {
    setLogType("DiagnosticsLog");
    setRemoteLocation("");
    setOldestTimestamp("");
    setLatestTimestamp("");
    setState({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    setState({ status: "loading" });

    const outcome = await api.ChargePoints.startLogUpload(chargePointId, {
      logType,
      remoteLocation,
      oldestTimestamp: toIsoOrUndefined(oldestTimestamp),
      latestTimestamp: toIsoOrUndefined(latestTimestamp),
    });

    setState({ status: "done", outcome });
    if (outcome.ok) onStarted();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={uploadInProgress || disabled}>
          <FileDown className="mr-1.5 h-4 w-4" />
          {t("appPage.chargePoints.logUpload.start.button")}
        </Button>
      </DialogTrigger>

      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("appPage.chargePoints.logUpload.start.title")}</DialogTitle>
          <DialogDescription>
            {t("appPage.chargePoints.logUpload.start.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="log-upload-type">
              {t("appPage.chargePoints.logUpload.start.fields.logType")}
            </Label>
            <Select value={logType} onValueChange={(value) => setLogType(value as GetLogTypeV201)}>
              <SelectTrigger id="log-upload-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GET_LOG_TYPES_V201.filter(
                  (type) => type !== "SecurityLog" || supportsSecurityLog,
                ).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`appPage.chargePoints.logUpload.logTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!supportsSecurityLog && (
              <span className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.logUpload.start.unsupportedSecurityLog")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="log-upload-location">
              {t("appPage.chargePoints.logUpload.start.fields.remoteLocation")}
            </Label>
            <Input
              id="log-upload-location"
              value={remoteLocation}
              onChange={(event) => setRemoteLocation(event.target.value)}
              placeholder="https://uploads.example.com/logs"
            />
            {remoteLocation.length > 0 && !locationIsValid && (
              <span className="text-xs text-destructive">
                {t("appPage.chargePoints.logUpload.start.fields.remoteLocationInvalid")}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="log-upload-oldest">
                {t("appPage.chargePoints.logUpload.start.fields.oldestTimestamp")}
              </Label>
              <Input
                id="log-upload-oldest"
                type="datetime-local"
                value={oldestTimestamp}
                onChange={(event) => setOldestTimestamp(event.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="log-upload-latest">
                {t("appPage.chargePoints.logUpload.start.fields.latestTimestamp")}
              </Label>
              <Input
                id="log-upload-latest"
                type="datetime-local"
                value={latestTimestamp}
                onChange={(event) => setLatestTimestamp(event.target.value)}
              />
            </div>
          </div>

          {state.status === "done" &&
            (state.outcome.ok ? (
              <div className="flex items-center gap-2 text-sm text-status-available-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {state.outcome.status === null
                  ? // A 1.6 station acknowledged the frame and nothing more.
                    t("appPage.chargePoints.logUpload.start.result.requested")
                  : t("appPage.chargePoints.logUpload.start.result.accepted")}
              </div>
            ) : (
              <Callout description={t(errorMessageKey(state.outcome.httpStatus))} variant="error" />
            ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            {t("common.close")}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={state.status === "loading"}
          >
            {t("appPage.chargePoints.logUpload.start.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
