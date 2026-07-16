import { ResetType } from "@watchborne/charge-points-types";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResetChargePointOutcome } from "@/lib/api-charge-points";
import { ChargePoint } from "@/types/charge-point";

import { Callout } from "../../components/common/Callout";

const errorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.reset.result.notFound";
    case 409:
      return "appPage.chargePoints.reset.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.reset.result.stationError";
    case 504:
      return "appPage.chargePoints.reset.result.timeout";
    default:
      return "appPage.chargePoints.reset.result.genericError";
  }
};

export const ChargePointResetDialog = ({
  resetTarget,
  onOpenChange,
  onConfirm,
}: {
  resetTarget: ChargePoint | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (type: ResetType) => Promise<ResetChargePointOutcome>;
}) => {
  const t = useTranslations("");
  const [type, setType] = useState<ResetType>("Hard");
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ResetChargePointOutcome | null>(null);

  // Reset the local state each time a fresh target opens the dialog, so a
  // previous run's selection/result never leaks into the next one.
  useEffect(() => {
    if (resetTarget) {
      setType("Hard");
      setSubmitting(false);
      setOutcome(null);
    }
  }, [resetTarget]);

  const handleConfirm = async () => {
    setSubmitting(true);
    const result = await onConfirm(type);
    setOutcome(result);
    setSubmitting(false);
  };

  return (
    <AlertDialog open={!!resetTarget} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {resetTarget && t("appPage.chargePoints.reset.title", { name: resetTarget.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("appPage.chargePoints.reset.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {outcome ? (
          outcome.ok ? (
            <div className="flex items-center gap-2 rounded-lg border border-status-available/20 bg-status-available-soft p-4 text-status-available-foreground">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">{t("appPage.chargePoints.reset.result.accepted")}</p>
            </div>
          ) : (
            <Callout error={t(errorMessageKey(outcome.httpStatus))} variant="error" />
          )
        ) : (
          <div className="space-y-2 py-1">
            <Label htmlFor="reset-type">{t("appPage.chargePoints.reset.typeLabel")}</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ResetType)}
              disabled={submitting}
            >
              <SelectTrigger id="reset-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hard">{t("appPage.chargePoints.reset.types.hard")}</SelectItem>
                <SelectItem value="Soft">{t("appPage.chargePoints.reset.types.soft")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <AlertDialogFooter>
          {outcome ? (
            <Button onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                )}
                {t("appPage.chargePoints.reset.confirm")}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
