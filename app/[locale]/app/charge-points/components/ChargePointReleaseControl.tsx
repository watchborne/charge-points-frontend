"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button, Callout } from "@watchborne/electrons";
import { Loader2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { getReleaseErrorMessageKey } from "@/lib/error-messages";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

type ReleaseState =
  { status: "idle" } | { status: "loading" } | { status: "done"; httpStatus: number };

type ChargePointReleaseControlProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
  // Fired only on a successful release: the charge point then drops out of
  // this caller's own fleet, so whoever is showing its detail panel needs to
  // know to stop — a failed attempt (already released elsewhere, out of
  // scope) changes nothing and leaves the panel as is.
  onReleased: () => void;
};

/**
 * Lets the current member give up their own access to a charge point
 * (charge-points-server ADR 0028, issue #424) — the self-service fix for a
 * station claimed with the wrong installer's commissioning token. Other
 * members, if any, keep theirs; when this was the last membership the
 * station returns to the commissioning queue. Irreversible from here (the
 * next claimer is whoever next presents a valid token to it), so this always
 * goes through a confirmation step first.
 */
export const ChargePointReleaseControl = ({
  chargePointId,
  chargePointName,
  onReleased,
}: ChargePointReleaseControlProps) => {
  const t = useTranslations("");
  const queryClient = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [releaseState, setReleaseState] = useState<ReleaseState>({ status: "idle" });

  const handleConfirm = async () => {
    setReleaseState({ status: "loading" });
    const outcome = await api.ChargePoints.releaseChargePoint(chargePointId);

    if (outcome.ok) {
      queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });
      onReleased();
      return;
    }

    setReleaseState({ status: "done", httpStatus: outcome.httpStatus });
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={releaseState.status === "loading"}
        >
          {releaseState.status === "loading" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Unlink className="mr-1.5 h-4 w-4" />
          )}
          {t("appPage.chargePoints.release.button")}
        </Button>
      </div>

      {releaseState.status === "done" && (
        <Callout
          description={t(getReleaseErrorMessageKey(releaseState.httpStatus))}
          variant="error"
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("appPage.chargePoints.release.confirmTitle", { name: chargePointName })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("appPage.chargePoints.release.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirm}
            >
              {t("appPage.chargePoints.release.button")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
