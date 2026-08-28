"use client";

import { Button } from "@watchborne/electrons";
import { Check, Copy, PlugZap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatedChargePoint } from "@/types/charge-point";

type ChargePointConnectionUrlDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargePoint: CreatedChargePoint | null;
};

/**
 * Shown right after a charge point is pre-provisioned (ADR 0010,
 * charge-points-server): the installer's only remaining step is to paste this
 * URL into the physical device's own OCPP configuration screen — the OCPP
 * identity embedded in it is generated server-side and never typed by hand,
 * which is the point of this flow (no free-text identifier to invent or
 * duplicate). Shown once, like `CommissioningTokenPanel`'s revealed token —
 * every later read rebuilds the same charge point without this URL, since it
 * is derived rather than stored.
 */
export const ChargePointConnectionUrlDialog = ({
  open,
  onOpenChange,
  chargePoint,
}: ChargePointConnectionUrlDialogProps) => {
  const t = useTranslations("");
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (!chargePoint) return;
    await navigator.clipboard.writeText(chargePoint.connectionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopied(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-charge-strong" />
            {t("appPage.chargePoints.connectionUrl.title")}
          </DialogTitle>
          <DialogDescription>
            {chargePoint &&
              t("appPage.chargePoints.connectionUrl.description", { name: chargePoint.name })}
          </DialogDescription>
        </DialogHeader>

        {chargePoint && (
          <div className="flex flex-col gap-2 py-2">
            <div className="flex items-center gap-2">
              <code className="block w-full min-w-0 flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {chargePoint.connectionUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyUrl()}
                aria-label={t("appPage.chargePoints.connectionUrl.copyCta")}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("appPage.chargePoints.connectionUrl.hint")}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t("appPage.chargePoints.connectionUrl.doneCta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
