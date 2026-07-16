import { Site } from "@watchborne/charge-points-types";
import { formatDistanceToNow, format } from "date-fns";
import { enGB } from "date-fns/locale";
import { Battery, Clock, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatusBadge } from "../../components/charge-points/StatusBadge";
import { Callout } from "../../components/common/Callout";
import { ConnectorStatusIcon } from "../../components/common/ConnectorStatusIcon";
import { Tag } from "../../components/common/Tag";

type ChargePointDetailPanelProps = {
  chargePoint: ChargePointWithConnectors;
  site: Site | undefined;
  onToggleActive: (cp: ChargePointWithConnectors) => void;
  onEditClicked: (cp: ChargePointWithConnectors) => void;
  onDeleteClicked: (cp: ChargePointWithConnectors) => void;
};

export const ChargePointDetailPanel = ({
  chargePoint,
  site,
  onToggleActive,
  onEditClicked,
  onDeleteClicked,
}: ChargePointDetailPanelProps) => {
  const t = useTranslations("");

  const lastSeenText =
    chargePoint.connection.lastSeenAt &&
    formatDistanceToNow(new Date(chargePoint.connection.lastSeenAt), {
      addSuffix: true,
      locale: enGB,
    });

  return (
    <div className="flex h-full flex-col gap-4">
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
          <div className="mt-2">
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

      {chargePoint.connection.statusMessage && (
        <Callout error={chargePoint.connection.statusMessage} variant="warning" />
      )}

      {chargePoint.connectors.length > 0 && (
        <div className="divide-y rounded-md border">
          {chargePoint.connectors.map((connector) => (
            <div key={connector.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.detail.connector", {
                  connectorId: connector.connectorId,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <ConnectorStatusIcon status={connector.status} />
                <span className="text-sm font-medium">{connector.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.detail.lastSeen")}
        </span>
        <span className="flex flex-col items-end text-sm font-medium">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {lastSeenText ?? t("appPage.chargePoints.detail.never")}
          </span>
          {chargePoint.connection.lastSeenAt && (
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(chargePoint.connection.lastSeenAt), "dd/MM/yyyy HH:mm:ss")}
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.detail.site")}
        </span>
        <span className="text-sm font-medium">
          {site ? <Tag>{site.name}</Tag> : t("appPage.chargePoints.detail.unknownSite")}
        </span>
      </div>

      {chargePoint.meta && (
        <div className="divide-y rounded-md border">
          {chargePoint.meta.vendor && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.form.fields.vendor")}
              </span>
              <span className="text-sm font-medium">{chargePoint.meta.vendor}</span>
            </div>
          )}
          {chargePoint.meta.model && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.form.fields.model")}
              </span>
              <span className="text-sm font-medium">{chargePoint.meta.model}</span>
            </div>
          )}
          {chargePoint.meta.serialNumber && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.form.fields.serialNumber")}
              </span>
              <span className="font-mono text-sm">{chargePoint.meta.serialNumber}</span>
            </div>
          )}
          {chargePoint.meta.firmwareVersion && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.form.fields.firmware")}
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                v{chargePoint.meta.firmwareVersion}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
