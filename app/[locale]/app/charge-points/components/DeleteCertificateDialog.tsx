"use client";

import { Button, Callout } from "@watchborne/electrons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@watchborne/electrons";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { getCertificateDeleteErrorMessageKey } from "@/lib/error-messages";
import type { CertificateHashData } from "@/types/certificate";
import type { ChargePoint } from "@/types/charge-point";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: Awaited<ReturnType<typeof api.ChargePoints.deleteCertificate>> };

type DeleteCertificateDialogProps = {
  chargePointId: ChargePoint["id"];
  certificateHashData: CertificateHashData;
  onDeleted: () => void;
  /** The charge point is deactivated: no command may be sent to it. */
  disabled?: boolean;
};

/**
 * Confirms and issues `DeleteCertificate` for one certificate, showing the
 * station's outcome (accepted/failed/not found) inline before closing.
 */
export const DeleteCertificateDialog = ({
  chargePointId,
  certificateHashData,
  onDeleted,
  disabled = false,
}: DeleteCertificateDialogProps) => {
  const t = useTranslations("");

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setState({ status: "idle" });
  };

  const handleConfirm = async () => {
    setState({ status: "loading" });
    const outcome = await api.ChargePoints.deleteCertificate(chargePointId, certificateHashData);
    setState({ status: "done", outcome });
    if (outcome.ok && outcome.status === "Accepted") onDeleted();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("appPage.chargePoints.certificates.row.delete")}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("appPage.chargePoints.certificates.delete.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("appPage.chargePoints.certificates.delete.confirmDescription", {
              serialNumber: certificateHashData.serialNumber,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.status === "done" &&
          (state.outcome.ok ? (
            <Callout
              description={t(
                `appPage.chargePoints.certificates.delete.result.${state.outcome.status.toLowerCase()}`,
              )}
              variant={state.outcome.status === "Accepted" ? "success" : "error"}
            />
          ) : (
            <Callout
              description={t(getCertificateDeleteErrorMessageKey(state.outcome.httpStatus))}
              variant="error"
            />
          ))}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOpenChange(false)}>
            {t("common.actions.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={state.status === "loading"}
          >
            {state.status === "loading" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
