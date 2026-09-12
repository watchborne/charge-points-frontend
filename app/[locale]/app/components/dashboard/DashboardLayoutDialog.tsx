import { Button, Switch } from "@watchborne/electrons";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardWidgetId, DashboardWidgetPreference } from "@/lib/dashboard-layout";

type DashboardLayoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: DashboardWidgetPreference[];
  onToggleVisibility: (id: DashboardWidgetId) => void;
  onMove: (id: DashboardWidgetId, direction: "up" | "down") => void;
  onReset: () => void;
};

export const DashboardLayoutDialog = ({
  open,
  onOpenChange,
  layout,
  onToggleVisibility,
  onMove,
  onReset,
}: DashboardLayoutDialogProps) => {
  const t = useTranslations("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("appPage.dashboard.layout.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("appPage.dashboard.layout.dialogDescription")}</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col divide-y">
          {layout.map((widget, index) => {
            const label = t(`appPage.dashboard.layout.widgets.${widget.id}`);

            return (
              <li key={widget.id} className="flex items-center gap-2 py-2">
                <div className="flex shrink-0 flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => onMove(widget.id, "up")}
                    aria-label={t("appPage.dashboard.layout.moveUp", { widget: label })}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === layout.length - 1}
                    onClick={() => onMove(widget.id, "down")}
                    aria-label={t("appPage.dashboard.layout.moveDown", { widget: label })}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <span className="flex-1 text-sm">{label}</span>

                <Switch
                  checked={widget.visible}
                  onCheckedChange={() => onToggleVisibility(widget.id)}
                  aria-label={t("appPage.dashboard.layout.toggleVisible", { widget: label })}
                />
              </li>
            );
          })}
        </ul>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onReset}>
            {t("appPage.dashboard.layout.reset")}
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t("appPage.dashboard.layout.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
