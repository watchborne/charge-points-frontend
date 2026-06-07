import {
  Battery,
  CheckCircle,
  ChevronDown,
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
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

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
import { Site } from "@ev-charge-point-monitor/charge-point-types";
import { StatusBadge } from "@/app/components/charge-points/StatusBadge";
import { api } from "@/lib/api";
import { Tag } from "@/app/components/common/Tag";
import { Callout } from "@/app/components/common/Callout";

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
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!chargePoint) {
      setLogs([]);
      setExpandedLogs(new Set());
      return;
    }
    setLogsLoading(true);
    setExpandedLogs(new Set());
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

  const toggleLog = (logUuid: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logUuid)) {
        newSet.delete(logUuid);
      } else {
        newSet.add(logUuid);
      }
      return newSet;
    });
  };

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
          {chargePoint.connection.statusMessage && (
            <Callout
              error={chargePoint.connection.statusMessage}
              variant="warning"
            />
          )}

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
            <span className="text-sm font-medium flex flex-col items-end">
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
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {logs.map((log, i) => {
                  const hasPayload = Object.keys(log.payload).length > 0;
                  if (
                    hasPayload ||
                    (chargePoint.connection.status === "WARNING" &&
                      log.action === "ERROR")
                  ) {
                    return (
                      <Collapsible
                        key={log.uuid}
                        open={expandedLogs.has(log.uuid)}
                      >
                        <div className="px-3 py-2">
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors text-left"
                              onClick={() => toggleLog(log.uuid)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ChevronDown
                                  className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                                    expandedLogs.has(log.uuid)
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                                <Badge
                                  variant="secondary"
                                  className="font-mono text-xs shrink-0"
                                >
                                  <div className="flex items-center gap-2">
                                    {log.action}
                                    {"status" in log.payload && (
                                      <span className="italic font-medium">
                                        ({String(log.payload.status)})
                                      </span>
                                    )}
                                  </div>
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                {format(
                                  new Date(log.timestamp),
                                  "dd/MM/yyyy HH:mm:ss",
                                )}
                              </span>
                            </button>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="pt-2">
                              <pre className="text-xs text-muted-foreground bg-muted px-4 py-2 overflow-x-auto border-t">
                                {hasPayload ? (
                                  JSON.stringify(log.payload, null, 2)
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    {chargePoint.connection.statusMessage}
                                  </div>
                                )}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  }

                  return (
                    <div key={i} className="px-3 py-2">
                      <div className="w-full flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3.5" />
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs shrink-0"
                          >
                            {log.action}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {format(
                            new Date(log.timestamp),
                            "dd/MM/yyyy HH:mm:ss",
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
