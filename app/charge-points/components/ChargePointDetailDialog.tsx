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
import { formatDistanceToNow, format } from "date-fns";
import { enGB } from "date-fns/locale";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChargePoint, ChargePointLog } from "@/types/charge-point";
import { Site } from "@/types/site";
import { StatusBadge } from "@/app/components/charge-points/StatusBadge";
import { api } from "@/lib/api";
import { Tag } from "@/app/components/common/Tag";

type ChargePointDetailDialogProps = {
  chargePoint: ChargePoint | null;
  site: Site | undefined;
  onOpenChange: (open: boolean) => void;
  onEditClicked: (cp: ChargePoint) => void;
  onDeleteClicked: (cp: ChargePoint) => void;
};

export const ChargePointDetailDialog = ({
  chargePoint,
  site,
  onOpenChange,
  onEditClicked,
  onDeleteClicked,
}: ChargePointDetailDialogProps) => {
  const [logs, setLogs] = useState<ChargePointLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!chargePoint) {
      setLogs([]);
      return;
    }
    setLogsLoading(true);
    api.ChargePoints.getChargePointLogs(chargePoint.uuid)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [chargePoint?.uuid]);

  if (!chargePoint) return null;

  const lastSeenText =
    chargePoint.connection.lastSeen &&
    formatDistanceToNow(new Date(chargePoint.connection.lastSeen), {
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
            <Battery className="h-5 w-5 text-blue-600" />
            {chargePoint.name}
            {!chargePoint.isActive && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Inactive
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 py-2 pr-1">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Connection status
            </span>
            <StatusBadge status={chargePoint.connection.status} />
          </div>

          {chargePoint.status && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Charge status
              </span>
              <div className="flex items-center gap-1.5">
                {getChargePointStatusIcon(chargePoint.status)}
                <span className="text-sm font-medium">
                  {chargePoint.status}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last seen</span>
            <span className="text-sm font-medium flex flex-col content-stretch justify-end items-end">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {lastSeenText ?? "Never"}
              </span>
              {chargePoint.connection.lastSeen && (
                <span className="text-[10px] text-muted-foreground">
                  {format(
                    new Date(chargePoint.connection.lastSeen),
                    "dd/MM/yyyy HH:mm:ss",
                  )}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Site</span>
            <span className="text-sm font-medium">
              {site ? <Tag>{site.name}</Tag> : "Unknown site"}
            </span>
          </div>

          {/* Meta section */}
          {chargePoint.meta && (
            <div className="border rounded-md divide-y">
              {chargePoint.meta.chargePointVendor && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Vendor</span>
                  <span className="text-sm font-medium">
                    {chargePoint.meta.chargePointVendor}
                  </span>
                </div>
              )}
              {chargePoint.meta.chargePointModel && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm font-medium">
                    {chargePoint.meta.chargePointModel}
                  </span>
                </div>
              )}
              {chargePoint.meta.serialNumber && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Serial number
                  </span>
                  <span className="text-sm font-mono">
                    {chargePoint.meta.serialNumber}
                  </span>
                </div>
              )}
              {chargePoint.meta.firmwareVersion && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Firmware
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    v{chargePoint.meta.firmwareVersion}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Logs section */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Logs</h4>
            {logsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader className="h-4 w-4 animate-spin" />
                Loading logs…
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No logs available.
              </p>
            ) : (
              <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                      </span>
                    </div>
                    {Object.keys(log.payload).length > 0 && (
                      <pre className="text-xs text-muted-foreground bg-muted rounded px-2 py-1 overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
            Delete
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEditClicked(chargePoint);
            }}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getChargePointStatusIcon = (status: ChargePoint["status"]) => {
  switch (status) {
    case "Available":
      return <CheckCircle size="16px" className="text-green-600" />;
    case "Preparing":
      return <CircleEllipsis size="16px" className="text-yellow-600" />;
    case "Charging":
      return <PlugZap size="16px" className="text-blue-600" />;
    case "SuspendedEV":
    case "SuspendedEVSE":
      return <Pause size="16px" className="text-yellow-600" />;
    case "Finishing":
      return <Loader size="16px" className="text-blue-600" />;
    case "Reserved":
      return <Ticket size="16px" className="text-pink-600" />;
    case "Unavailable":
      return <X size="16px" className="text-red-600" />;
    case "Faulted":
      return <Shield size="16px" className="text-red-600" />;
    default:
      return null;
  }
};
