"use client";

import {
  INSTALL_CERTIFICATE_USE_TYPES_V201,
  type InstallCertificateUseV201,
} from "@watchborne/charge-points-types";
import { Button, Callout, Label } from "@watchborne/electrons";
import { Loader2, ShieldPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { InstallCertificateOutcome } from "@/lib/api-charge-points";
import { getCertificateInstallErrorMessageKey } from "@/lib/error-messages";
import type { ChargePoint } from "@/types/charge-point";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: InstallCertificateOutcome };

/**
 * `V2GRootCertificate`/`MORootCertificate` are OCPP 2.0.1-only trust anchors
 * (the V2G/e-mobility-provider PKI 1.6's Security Whitepaper extension has
 * no notion of) — installing one on a 1.6 station is rejected server-side
 * with a 409. Gating them here is convenience, mirroring
 * `StartLogUploadDialog`'s `supportsSecurityLog` gate.
 */
const V201_ONLY_TYPES: readonly InstallCertificateUseV201[] = [
  "V2GRootCertificate",
  "MORootCertificate",
];

/** Advisory only, like `StartLogUploadDialog`'s `isAcceptableLocation` — the
 * server stays authoritative on whether this is actually a valid certificate. */
const looksLikePemCertificate = (value: string): boolean =>
  value.includes("-----BEGIN CERTIFICATE-----");

type InstallCertificateDialogProps = {
  chargePointId: ChargePoint["id"];
  ocppVersion: ChargePoint["ocppVersion"];
  onInstalled: () => void;
};

/**
 * Lets an installer push a trust-anchor certificate to a station (OCPP
 * `InstallCertificate`), modeled closely on `StartLogUploadDialog`: plain
 * `useState` fields, a feather-light client-side check, and the station's
 * own verdict (accepted/rejected/failed) surfaced inline rather than
 * silently treated as a plain success — the backend answers 200 regardless
 * of which of the three the station reports.
 */
export const InstallCertificateDialog = ({
  chargePointId,
  ocppVersion,
  onInstalled,
}: InstallCertificateDialogProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [certificateType, setCertificateType] =
    useState<InstallCertificateUseV201>("CSMSRootCertificate");
  const [certificate, setCertificate] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const supportsV201Only = ocppVersion === "2.0.1";
  const certificateIsValid = certificate.trim().length > 0;
  const canSubmit = certificateIsValid && state.status !== "loading";

  const reset = () => {
    setCertificateType("CSMSRootCertificate");
    setCertificate("");
    setState({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    setState({ status: "loading" });

    const outcome = await api.ChargePoints.installCertificate(chargePointId, {
      certificateType,
      certificate,
    });

    setState({ status: "done", outcome });
    if (outcome.ok && outcome.status === "Accepted") onInstalled();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldPlus className="mr-1.5 h-4 w-4" />
          {t("appPage.chargePoints.certificates.install.button")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("appPage.chargePoints.certificates.install.title")}</DialogTitle>
          <DialogDescription>
            {t("appPage.chargePoints.certificates.install.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="certificate-type">
              {t("appPage.chargePoints.certificates.install.fields.certificateType")}
            </Label>
            <Select
              value={certificateType}
              onValueChange={(value) => setCertificateType(value as InstallCertificateUseV201)}
            >
              <SelectTrigger id="certificate-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTALL_CERTIFICATE_USE_TYPES_V201.filter(
                  (type) => !V201_ONLY_TYPES.includes(type) || supportsV201Only,
                ).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`appPage.chargePoints.certificates.types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!supportsV201Only && (
              <span className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.certificates.install.unsupportedV201Types")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="certificate-pem">
              {t("appPage.chargePoints.certificates.install.fields.certificate")}
            </Label>
            <Textarea
              id="certificate-pem"
              className="min-h-[160px] font-mono text-xs"
              value={certificate}
              onChange={(event) => setCertificate(event.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----"
            />
            {certificate.length > 0 && !looksLikePemCertificate(certificate) && (
              <span className="text-xs text-status-warning-foreground">
                {t("appPage.chargePoints.certificates.install.fields.certificateLooksInvalid")}
              </span>
            )}
          </div>

          {state.status === "done" &&
            (state.outcome.ok ? (
              <Callout
                description={t(
                  `appPage.chargePoints.certificates.install.result.${state.outcome.status.toLowerCase()}`,
                )}
                variant={state.outcome.status === "Accepted" ? "success" : "error"}
              />
            ) : (
              <Callout
                description={t(getCertificateInstallErrorMessageKey(state.outcome.httpStatus))}
                variant="error"
              />
            ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            {t("common.close")}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {state.status === "loading" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("appPage.chargePoints.certificates.install.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
