import { AvailabilityType, ResetType, SampledValue, Site } from "@watchborne/charge-points-types";
import { formatDistanceToNow, format } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  Battery,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Pencil,
  Power,
  RotateCcw,
  Trash2,
  Unlock,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointConfigurationDialog } from "./ChargePointConfigurationDialog";
import { TriggerMessageControl } from "./TriggerMessageControl";
import { StatusBadge } from "../../components/charge-points/StatusBadge";
import { Callout } from "../../components/common/Callout";
import { ConnectorStatusIcon } from "../../components/common/ConnectorStatusIcon";
import { Tag } from "../../components/common/Tag";

type ResetState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: ResetChargePointOutcome };

type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ChangeAvailabilityOutcome };

type UnlockConnectorState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: UnlockConnectorOutcome };

/** Key in the per-target availability state map for the "whole charge point" control (connectorId 0). */
const WHOLE_CHARGE_POINT_KEY = "chargePoint";

const resetErrorMessageKey = (httpStatus: number): string => {
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

const availabilityErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.availability.result.notFound";
    case 409:
      return "appPage.chargePoints.availability.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.availability.result.stationError";
    case 504:
      return "appPage.chargePoints.availability.result.timeout";
    default:
      return "appPage.chargePoints.availability.result.genericError";
  }
};

const availabilitySuccessMessageKey = (status: ChangeAvailabilityOutcome & { ok: true }): string =>
  status.status === "Scheduled"
    ? "appPage.chargePoints.availability.result.scheduled"
    : "appPage.chargePoints.availability.result.accepted";

const unlockConnectorErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.unlockConnector.result.notFound";
    case 409:
      return "appPage.chargePoints.unlockConnector.result.notConnectedOrFailed";
    case 502:
      return "appPage.chargePoints.unlockConnector.result.stationError";
    case 504:
      return "appPage.chargePoints.unlockConnector.result.timeout";
    default:
      return "appPage.chargePoints.unlockConnector.result.genericError";
  }
};

const formatSampledValue = (sample: SampledValue): string =>
  sample.unit ? `${sample.value} ${sample.unit}` : sample.value;

type ChargePointDetailPanelProps = {
  chargePoint: ChargePointWithConnectors;
  site: Site | undefined;
  onToggleActive: (cp: ChargePointWithConnectors) => void;
  onEditClicked: (cp: ChargePointWithConnectors) => void;
  onDeleteClicked: (cp: ChargePointWithConnectors) => void;
  onResetClicked: (
    cp: ChargePointWithConnectors,
    type: ResetType,
  ) => Promise<ResetChargePointOutcome>;
  onChangeAvailability: (
    cp: ChargePointWithConnectors,
    connectorId: number,
    type: AvailabilityType,
  ) => Promise<ChangeAvailabilityOutcome>;
  onUnlockConnector: (
    cp: ChargePointWithConnectors,
    connectorId: number,
  ) => Promise<UnlockConnectorOutcome>;
};

export const ChargePointDetailPanel = ({
  chargePoint,
  site,
  onToggleActive,
  onEditClicked,
  onDeleteClicked,
  onResetClicked,
  onChangeAvailability,
  onUnlockConnector,
}: ChargePointDetailPanelProps) => {
  const t = useTranslations("");

  const [resetState, setResetState] = useState<ResetState>({ status: "idle" });
  const [availabilityState, setAvailabilityState] = useState<Record<string, AvailabilityState>>({});
  const [unlockConnectorState, setUnlockConnectorState] = useState<
    Record<string, UnlockConnectorState>
  >({});

  // Drop any previous run's pending/result state when a different station is
  // opened, so it never leaks across charge points.
  useEffect(() => {
    setResetState({ status: "idle" });
    setAvailabilityState({});
    setUnlockConnectorState({});
  }, [chargePoint?.id]);

  const handleReset = async (type: ResetType) => {
    setResetState({ status: "loading" });
    const outcome = await onResetClicked(chargePoint, type);
    setResetState({ status: "done", outcome });
  };

  const handleChangeAvailability = async (
    key: string,
    connectorId: number,
    type: AvailabilityType,
  ) => {
    setAvailabilityState((prev) => ({ ...prev, [key]: { status: "loading" } }));
    const outcome = await onChangeAvailability(chargePoint, connectorId, type);
    setAvailabilityState((prev) => ({ ...prev, [key]: { status: "done", outcome } }));
  };

  const handleUnlockConnector = async (key: string, connectorId: number) => {
    setUnlockConnectorState((prev) => ({ ...prev, [key]: { status: "loading" } }));
    const outcome = await onUnlockConnector(chargePoint, connectorId);
    setUnlockConnectorState((prev) => ({ ...prev, [key]: { status: "done", outcome } }));
  };

  const wholeChargePointAvailability: AvailabilityState = availabilityState[
    WHOLE_CHARGE_POINT_KEY
  ] ?? { status: "idle" };

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
        <Callout description={chargePoint.connection.statusMessage} variant="warning" />
      )}

      {chargePoint.connectors.length > 0 && (
        <div className="divide-y rounded-md border">
          {chargePoint.connectors.map((connector) => {
            const state = availabilityState[connector.id] ?? { status: "idle" };
            const unlockState = unlockConnectorState[connector.id] ?? { status: "idle" };
            return (
              <div key={connector.id} className="flex flex-col gap-1.5 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("appPage.chargePoints.detail.connector", {
                      connectorId: connector.connectorId,
                    })}
                  </span>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      <ConnectorStatusIcon status={connector.status} />
                      <span className="text-sm font-medium">{connector.status}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={state.status === "loading"}
                          aria-label={t("appPage.chargePoints.availability.button")}
                        >
                          {state.status === "loading" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeAvailability(
                              connector.id,
                              connector.connectorId,
                              "Operative",
                            )
                          }
                        >
                          {t("appPage.chargePoints.availability.types.operative")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeAvailability(
                              connector.id,
                              connector.connectorId,
                              "Inoperative",
                            )
                          }
                        >
                          {t("appPage.chargePoints.availability.types.inoperative")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={unlockState.status === "loading"}
                      aria-label={t("appPage.chargePoints.unlockConnector.button")}
                      onClick={() => handleUnlockConnector(connector.id, connector.connectorId)}
                    >
                      {unlockState.status === "loading" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {connector.lastMeterValue && (
                  <div
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    title={t("appPage.chargePoints.detail.lastMeterValue")}
                  >
                    <Zap className="h-3 w-3 shrink-0" />
                    <span>
                      {connector.lastMeterValue.sampledValue.map(formatSampledValue).join(" · ")}
                    </span>
                    <span>
                      (
                      {formatDistanceToNow(new Date(connector.lastMeterValue.timestamp), {
                        addSuffix: true,
                        locale: enGB,
                      })}
                      )
                    </span>
                  </div>
                )}
                {state.status === "done" &&
                  (state.outcome.ok ? (
                    <p className="text-xs font-medium text-status-available-foreground">
                      {t(availabilitySuccessMessageKey(state.outcome))}
                    </p>
                  ) : (
                    <Callout
                      description={t(availabilityErrorMessageKey(state.outcome.httpStatus))}
                      variant="error"
                    />
                  ))}
                {unlockState.status === "done" &&
                  (unlockState.outcome.ok ? (
                    <p className="text-xs font-medium text-status-available-foreground">
                      {t("appPage.chargePoints.unlockConnector.result.unlocked")}
                    </p>
                  ) : (
                    <Callout
                      description={t(
                        unlockConnectorErrorMessageKey(unlockState.outcome.httpStatus),
                      )}
                      variant="error"
                    />
                  ))}
              </div>
            );
          })}
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

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-stretch gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={resetState.status === "loading"}>
                {resetState.status === "loading" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                )}
                {t("appPage.chargePoints.reset.button")}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleReset("Hard")}>
                {t("appPage.chargePoints.reset.types.hard")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReset("Soft")}>
                {t("appPage.chargePoints.reset.types.soft")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChargePointConfigurationDialog
            chargePointId={chargePoint.id}
            chargePointName={chargePoint.name}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={wholeChargePointAvailability.status === "loading"}
              >
                {wholeChargePointAvailability.status === "loading" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Power className="h-4 w-4 mr-1.5" />
                )}
                {t("appPage.chargePoints.availability.wholeChargePoint")}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleChangeAvailability(WHOLE_CHARGE_POINT_KEY, 0, "Operative")}
              >
                {t("appPage.chargePoints.availability.types.operative")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleChangeAvailability(WHOLE_CHARGE_POINT_KEY, 0, "Inoperative")}
              >
                {t("appPage.chargePoints.availability.types.inoperative")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TriggerMessageControl chargePointId={chargePoint.id} />

        {resetState.status === "done" &&
          (resetState.outcome.ok ? (
            <div className="flex items-center gap-2 rounded-lg border border-status-available/20 bg-status-available-soft p-3 text-status-available-foreground text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-medium">{t("appPage.chargePoints.reset.result.accepted")}</p>
            </div>
          ) : (
            <Callout
              description={t(resetErrorMessageKey(resetState.outcome.httpStatus))}
              variant="error"
            />
          ))}

        {wholeChargePointAvailability.status === "done" &&
          (wholeChargePointAvailability.outcome.ok ? (
            <div className="flex items-center gap-2 rounded-lg border border-status-available/20 bg-status-available-soft p-3 text-status-available-foreground text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-medium">
                {t(availabilitySuccessMessageKey(wholeChargePointAvailability.outcome))}
              </p>
            </div>
          ) : (
            <Callout
              description={t(
                availabilityErrorMessageKey(wholeChargePointAvailability.outcome.httpStatus),
              )}
              variant="error"
            />
          ))}
      </div>
    </div>
  );
};
