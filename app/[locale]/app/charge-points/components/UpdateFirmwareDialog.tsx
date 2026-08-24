"use client";

import { Button, Callout, Input, Label } from "@watchborne/electrons";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
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
import { api } from "@/lib/api";
import type { StartFirmwareUpdateOutcome } from "@/lib/api-charge-points";
import type { ChargePoint } from "@/types/charge-point";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: StartFirmwareUpdateOutcome };

/** Schemes a charge point actually fetches firmware over. Mirrors the backend. */
const ALLOWED_PROTOCOLS = ["http:", "https:", "ftp:", "ftps:"];

/**
 * Client-side check on the URL an installer types — deliberately the same
 * allowlist the backend enforces. Convenience, not the boundary: this field
 * decides what hardware downloads and executes, so the server stays authoritative.
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
      return "appPage.chargePoints.firmware.update.result.invalidRequest";
    case 404:
      return "appPage.chargePoints.firmware.update.result.notFound";
    case 409:
      return "appPage.chargePoints.firmware.update.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.firmware.update.result.stationError";
    case 504:
      return "appPage.chargePoints.firmware.update.result.timeout";
    default:
      return "appPage.chargePoints.firmware.update.result.genericError";
  }
};

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
const nowForInput = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

type UpdateFirmwareDialogProps = {
  chargePointId: ChargePoint["id"];
  /** Gates the signed-firmware fields: OCPP 1.6 has nowhere to put them. */
  ocppVersion: ChargePoint["ocppVersion"];
  /** Refuses upfront when the station already has an update running. */
  updateInProgress: boolean;
  onStarted: () => void;
};

/**
 * Lets an installer start a firmware update (OCPP `UpdateFirmware`).
 *
 * The station's answer isn't a plain success: a 2.0.1 station reports a
 * status, a 1.6 station only acknowledges the frame (empty payload) — so a
 * `null` status is reported as "requested" rather than "accepted", and the
 * real outcome arrives through the timeline.
 */
export const UpdateFirmwareDialog = ({
  chargePointId,
  ocppVersion,
  updateInProgress,
  onStarted,
}: UpdateFirmwareDialogProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [retrieveDateTime, setRetrieveDateTime] = useState(nowForInput);
  const [retries, setRetries] = useState("");
  const [retryInterval, setRetryInterval] = useState("");
  const [signingCertificate, setSigningCertificate] = useState("");
  const [signature, setSignature] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const supportsSignedFirmware = ocppVersion === "2.0.1";
  const locationIsValid = location.length > 0 && isAcceptableLocation(location);
  const canSubmit = locationIsValid && retrieveDateTime.length > 0 && state.status !== "loading";

  const reset = () => {
    setLocation("");
    setRetrieveDateTime(nowForInput());
    setRetries("");
    setRetryInterval("");
    setSigningCertificate("");
    setSignature("");
    setState({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const optionalInt = (value: string): number | undefined =>
    value.trim() === "" ? undefined : Number(value);

  const handleSubmit = async () => {
    setState({ status: "loading" });

    const outcome = await api.ChargePoints.startFirmwareUpdate(chargePointId, {
      location,
      // The input is local time; send an unambiguous instant rather than a
      // bare local string.
      retrieveDateTime: new Date(retrieveDateTime).toISOString(),
      retries: optionalInt(retries),
      retryInterval: optionalInt(retryInterval),
      ...(supportsSignedFirmware && {
        signingCertificate: signingCertificate.trim() || undefined,
        signature: signature.trim() || undefined,
      }),
    });

    setState({ status: "done", outcome });
    if (outcome.ok) onStarted();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={updateInProgress}
          aria-label={t("appPage.chargePoints.firmware.update.button")}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("appPage.chargePoints.firmware.update.title")}</DialogTitle>
          <DialogDescription>
            {t("appPage.chargePoints.firmware.update.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firmware-location">
              {t("appPage.chargePoints.firmware.update.fields.location")}
            </Label>
            <Input
              id="firmware-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="https://firmware.example.com/2.4.1.bin"
            />
            {location.length > 0 && !locationIsValid && (
              <span className="text-xs text-destructive">
                {t("appPage.chargePoints.firmware.update.fields.locationInvalid")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firmware-retrieve-at">
              {t("appPage.chargePoints.firmware.update.fields.retrieveDateTime")}
            </Label>
            <Input
              id="firmware-retrieve-at"
              type="datetime-local"
              value={retrieveDateTime}
              onChange={(event) => setRetrieveDateTime(event.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="firmware-retries">
                {t("appPage.chargePoints.firmware.update.fields.retries")}
              </Label>
              <Input
                id="firmware-retries"
                type="number"
                min={0}
                value={retries}
                onChange={(event) => setRetries(event.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="firmware-retry-interval">
                {t("appPage.chargePoints.firmware.update.fields.retryInterval")}
              </Label>
              <Input
                id="firmware-retry-interval"
                type="number"
                min={0}
                value={retryInterval}
                onChange={(event) => setRetryInterval(event.target.value)}
              />
            </div>
          </div>

          {supportsSignedFirmware ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firmware-signing-certificate">
                  {t("appPage.chargePoints.firmware.update.fields.signingCertificate")}
                </Label>
                <Input
                  id="firmware-signing-certificate"
                  value={signingCertificate}
                  onChange={(event) => setSigningCertificate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firmware-signature">
                  {t("appPage.chargePoints.firmware.update.fields.signature")}
                </Label>
                <Input
                  id="firmware-signature"
                  value={signature}
                  onChange={(event) => setSignature(event.target.value)}
                />
              </div>
            </>
          ) : (
            <Callout
              description={t("appPage.chargePoints.firmware.update.unsignedDialect")}
              variant="info"
            />
          )}

          {state.status === "done" &&
            (state.outcome.ok ? (
              <div className="flex items-center gap-2 text-sm text-status-available-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {state.outcome.status === null
                  ? // A 1.6 station acknowledged the frame and nothing more.
                    t("appPage.chargePoints.firmware.update.result.requested")
                  : t("appPage.chargePoints.firmware.update.result.accepted")}
              </div>
            ) : (
              <Callout description={t(errorMessageKey(state.outcome.httpStatus))} variant="error" />
            ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            {t("appPage.chargePoints.firmware.update.close")}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {state.status === "loading" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("appPage.chargePoints.firmware.update.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
