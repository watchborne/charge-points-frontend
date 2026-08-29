"use client";

import { GET_LOG_TYPES_V201, type GetLogTypeV201 } from "@watchborne/charge-points-types";
import { Button, Callout, Input, Label } from "@watchborne/electrons";
import { CheckCircle2, FileDown, Loader2 } from "lucide-react";
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
import type { StartLogUploadOutcome } from "@/lib/api-charge-points";
import type { ChargePoint } from "@/types/charge-point";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: StartLogUploadOutcome };

/** Schemes a station actually uploads to. Mirrors the backend. */
const ALLOWED_PROTOCOLS = ["http:", "https:", "ftp:", "ftps:"];

/**
 * Client-side check on the URL an installer types — deliberately the same
 * allowlist `UpdateFirmwareDialog` enforces for its own target URL.
 * Convenience, not the boundary: this field decides where the station sends
 * its log file, so the server stays authoritative.
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
  /** `SecurityLog` has no OCPP 1.6 equivalent — gates that option out (mirrors
   * `UpdateFirmwareDialog`'s signed-firmware gate on `ocppVersion`). */
  ocppVersion: ChargePoint["ocppVersion"];
  /** Refuses upfront when the station already has an upload running. */
  uploadInProgress: boolean;
  onStarted: () => void;
};

/**
 * Lets an installer request a remote log/diagnostics bundle (OCPP
 * `GetDiagnostics` for a 1.6 station, `GetLog` for 2.0.1 — the backend picks
 * the right one automatically).
 *
 * The station's answer isn't a plain success: a 2.0.1 station reports a
 * status, a 1.6 station only acknowledges the frame (its `GetDiagnostics.conf`
 * carries no accept/reject vocabulary at all) — so a `null` status is reported
 * as "requested" rather than "accepted", and the real outcome arrives through
 * the upload's own status.
 */
export const StartLogUploadDialog = ({
  chargePointId,
  ocppVersion,
  uploadInProgress,
  onStarted,
}: StartLogUploadDialogProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [logType, setLogType] = useState<GetLogTypeV201>("DiagnosticsLog");
  const [remoteLocation, setRemoteLocation] = useState("");
  const [oldestTimestamp, setOldestTimestamp] = useState("");
  const [latestTimestamp, setLatestTimestamp] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  // 1.6 has no `logType` concept at all — a `GetDiagnostics` request always
  // fetches the (only) diagnostics bundle, so offering "Security log" would
  // promise something the station has nowhere to put.
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
        <Button variant="outline" size="sm" disabled={uploadInProgress}>
          <FileDown className="mr-1.5 h-4 w-4" />
          {t("appPage.chargePoints.logUpload.start.button")}
        </Button>
      </DialogTrigger>

      <DialogContent>
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
            {t("appPage.chargePoints.logUpload.start.close")}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {state.status === "loading" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("appPage.chargePoints.logUpload.start.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
