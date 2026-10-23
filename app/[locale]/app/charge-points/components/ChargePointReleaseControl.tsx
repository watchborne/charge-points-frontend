"use client";

import { useQueryClient } from "@tanstack/react-query";
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
} from "@watchborne/electrons";
import { Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api";
import { getReleaseErrorMessageKey } from "@/lib/error-messages";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

type ReleaseState =
  { status: "idle" } | { status: "loading" } | { status: "done"; httpStatus: number };

type ChargePointReleaseControlProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
  // Fired only on success: the charge point leaves the caller's fleet.
  onReleased: () => void;
};

/**
 * Lets a member give up their own access to a charge point, e.g. one claimed
 * with the wrong installer's token. Other members keep theirs; the last one
 * leaving returns the station to the commissioning queue. Confirmed first,
 * since it can't be undone from here.
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
          loading={releaseState.status === "loading"}
        >
          {releaseState.status !== "loading" && <Unlink className="mr-1.5 h-4 w-4" />}
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
