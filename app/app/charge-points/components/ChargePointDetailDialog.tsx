import { Site } from "@watchborne/charge-points-types";
import { formatDistanceToNow, format } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  Battery,
  CheckCircle,
  CircleEllipsis,
  Clock,
  Loader,
  Pause,
  Pencil,
  PlugZap,
  Shield,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { connectorStatusTone, toneTextClass } from "@/lib/status";
import { ChargePointWithConnectors, ConnectorStatus } from "@/types/charge-point";

import { StatusBadge } from "../../components/charge-points/StatusBadge";
import { Callout } from "../../components/common/Callout";
import { Tag } from "../../components/common/Tag";

type ChargePointDetailDialogProps = {
  chargePoint: ChargePointWithConnectors | null;
  site: Site | undefined;
  onOpenChange: (open: boolean) => void;
  onEditClicked: (cp: ChargePointWithConnectors) => void;
  onDeleteClicked: (cp: ChargePointWithConnectors) => void;
};

export const ChargePointDetailDialog = ({
  chargePoint,
  site,
  onOpenChange,
  onEditClicked,
  onDeleteClicked,
}: ChargePointDetailDialogProps) => {
  const t = useTranslations("");

  if (!chargePoint) return null;

  const lastSeenText =
    chargePoint.connection.lastSeenAt &&
    formatDistanceToNow(new Date(chargePoint.connection.lastSeenAt), {
      addSuffix: true,
      locale: enGB,
    });

  return (
    <Dialog open={!!chargePoint} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-muted-foreground" />
            {chargePoint.name}
            {!chargePoint.isActive && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {t("appPage.chargePoints.detail.inactive")}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 py-2 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("appPage.chargePoints.detail.connectionStatus")}
            </span>
            <StatusBadge status={chargePoint.connection.status} />
          </div>
          {chargePoint.connection.statusMessage && (
            <Callout error={chargePoint.connection.statusMessage} variant="warning" />
          )}

          {chargePoint.connectors.length > 0 && (
            <div className="border rounded-md divide-y">
              {chargePoint.connectors.map((connector) => (
                <div key={connector.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {t("appPage.chargePoints.detail.connector", {
                      connectorId: connector.connectorId,
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getConnectorStatusIcon(connector.status)}
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
            <span className="text-sm font-medium flex flex-col items-end">
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
            <div className="border rounded-md divide-y">
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
                  <span className="text-sm font-mono">{chargePoint.meta.serialNumber}</span>
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

        <DialogFooter className="gap-2 sm:justify-between pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onDeleteClicked(chargePoint);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t("common.delete")}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEditClicked(chargePoint);
            }}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            {t("common.edit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getConnectorStatusIcon = (status: ConnectorStatus) => {
  const className = toneTextClass[connectorStatusTone(status)];

  switch (status) {
    case "Available":
      return <CheckCircle size="16px" className={className} />;
    case "Preparing":
      return <CircleEllipsis size="16px" className={className} />;
    case "Charging":
    case "Occupied":
      return <PlugZap size="16px" className={className} />;
    case "SuspendedEV":
    case "SuspendedEVSE":
      return <Pause size="16px" className={className} />;
    case "Finishing":
      return <Loader size="16px" className={className} />;
    case "Reserved":
      return <Ticket size="16px" className={className} />;
    case "Unavailable":
      return <X size="16px" className={className} />;
    case "Faulted":
      return <Shield size="16px" className={className} />;
    default:
      return null;
  }
};
