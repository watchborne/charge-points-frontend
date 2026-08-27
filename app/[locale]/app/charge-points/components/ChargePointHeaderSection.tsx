import { Badge, Button, Switch } from "@watchborne/electrons";
import { Battery, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatusBadge } from "../../components/charge-points/StatusBadge";

type ChargePointHeaderSectionProps = {
  chargePoint: ChargePointWithConnectors;
  onToggleActive: (cp: ChargePointWithConnectors) => void;
  onEditClicked: (cp: ChargePointWithConnectors) => void;
  onDeleteClicked: (cp: ChargePointWithConnectors) => void;
};

export const ChargePointHeaderSection = ({
  chargePoint,
  onToggleActive,
  onEditClicked,
  onDeleteClicked,
}: ChargePointHeaderSectionProps) => {
  const t = useTranslations("");

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h4 className="flex items-center gap-2 text-lg font-semibold">
          <Battery className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="truncate">{chargePoint.name}</span>
          {!chargePoint.isActive && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {t("appPage.chargePoints.detail.inactive")}
            </span>
          )}
        </h4>
        <div className="mt-2 flex items-center gap-2">
          <Badge>OCPP {chargePoint.ocppVersion}</Badge>
          <StatusBadge status={chargePoint.connection.status} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          {t("appPage.chargePoints.page.table.columns.active")}
          <Switch
            checked={chargePoint.isActive}
            onCheckedChange={() => onToggleActive(chargePoint)}
            aria-label={`Toggle ${chargePoint.name} active state`}
          />
        </label>
        <Button size="sm" variant="outline" onClick={() => onEditClicked(chargePoint)}>
          <Pencil className="mr-1.5 h-4 w-4" />
          {t("common.edit")}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDeleteClicked(chargePoint)}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t("common.delete")}
        </Button>
      </div>
    </div>
  );
};
