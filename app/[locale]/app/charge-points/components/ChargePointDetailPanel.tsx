import { AvailabilityType, ResetType, Site } from "@watchborne/charge-points-types";
import { Callout, Tag, Tabs, TabsList, TabsTrigger, Button } from "@watchborne/electrons";
import { formatDistanceToNow, format } from "date-fns";
import { enGB } from "date-fns/locale";
import { CheckCircle2, ChevronDown, Clock, Loader2, Power, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { getResetErrorMessageKey, getAvailabilityErrorMessageKey } from "@/lib/error-messages";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { AlertsPanel } from "./AlertsPanel";
import { ChargePointConfigurationDialog } from "./ChargePointConfigurationDialog";
import { ChargePointConsumptionPanel } from "./ChargePointConsumptionPanel";
import { ChargePointHeaderSection } from "./ChargePointHeaderSection";
import { ChargePointMetadataSection } from "./ChargePointMetadataSection";
import { ConnectorStatusSection } from "./ConnectorStatusSection";
import { LogUploadPanel } from "./LogUploadPanel";
import { SecurityEventsPanel } from "./SecurityEventsPanel";
import { StatusHistoryPanel } from "./StatusHistoryPanel";
import { TriggerMessageControl } from "./TriggerMessageControl";
import { ActionsDropdown } from "../../components/common/ActionsDropdown";
import { StatusActionDropdown } from "../../components/common/StatusActionDropdown";
import { useChargePointActions } from "../hooks/useChargePointActions";

type ResetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ResetChargePointOutcome };

type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ChangeAvailabilityOutcome };

type UnlockConnectorState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: UnlockConnectorOutcome };

/** Key in the per-target availability state map for the "whole charge point" control (connectorId 0). */
const WHOLE_CHARGE_POINT_KEY = "chargePoint";

type DetailTab = "main" | "consumption" | "alerts" | "security";
const DETAIL_TABS: readonly DetailTab[] = ["main", "consumption", "alerts", "security"];

const availabilitySuccessMessageKey = (status: ChangeAvailabilityOutcome & { ok: true }): string =>
  status.status === "Scheduled"
    ? "appPage.chargePoints.availability.result.scheduled"
    : "appPage.chargePoints.availability.result.accepted";

type ChargePointDetailPanelProps = {
  chargePoint: ChargePointWithConnectors;
  site: Site | undefined;
  onEditClicked: (cp: ChargePointWithConnectors) => void;
  onDeleteClicked: (cp: ChargePointWithConnectors) => void;
};

export const ChargePointDetailPanel = ({
  chargePoint,
  site,
  onEditClicked,
  onDeleteClicked,
}: ChargePointDetailPanelProps) => {
  const t = useTranslations("");

  const actions = useChargePointActions({
    chargePointId: chargePoint.id,
    currentChargePoint: chargePoint,
    onEditClick: () => onEditClicked(chargePoint),
    onDeleteClick: () => onDeleteClicked(chargePoint),
  });

  const [tab, setTab] = useState<DetailTab>("main");
  const [resetState, setResetState] = useState<ResetState>({ status: "idle" });
  const [availabilityState, setAvailabilityState] = useState<Record<string, AvailabilityState>>({});
  const [unlockConnectorState, setUnlockConnectorState] = useState<
    Record<string, UnlockConnectorState>
  >({});

  // Drop any previous run's pending/result state when a different station is
  // opened, so it never leaks across charge points.
  useEffect(() => {
    setTab("main");
    setResetState({ status: "idle" });
    setAvailabilityState({});
    setUnlockConnectorState({});
  }, [chargePoint?.id]);

  const handleReset = async (type: ResetType) => {
    setResetState({ status: "loading" });
    const outcome = await actions.reset(type);
    setResetState({ status: "done", outcome });
  };

  const handleChangeAvailability = async (
    key: string,
    connectorId: number,
    type: AvailabilityType,
  ) => {
    setAvailabilityState((prev) => ({ ...prev, [key]: { status: "loading" } }));
    const outcome = await actions.changeAvailability(connectorId, type);
    setAvailabilityState((prev) => ({ ...prev, [key]: { status: "done", outcome } }));
  };

  const handleUnlockConnector = async (key: string, connectorId: number) => {
    setUnlockConnectorState((prev) => ({ ...prev, [key]: { status: "loading" } }));
    const outcome = await actions.unlockConnector(connectorId);
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
      <ChargePointHeaderSection
        chargePoint={chargePoint}
        onToggleActive={() => actions.toggleActive()}
        onEditClicked={onEditClicked}
        onDeleteClicked={onDeleteClicked}
      />

      {chargePoint.connection.statusMessage && (
        <Callout description={chargePoint.connection.statusMessage} variant="warning" />
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as DetailTab)}
        className="overflow-auto"
      >
        <TabsList>
          {DETAIL_TABS.map((option) => (
            <TabsTrigger key={option} value={option}>
              {t(`appPage.chargePoints.detail.tabs.${option}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "main" && (
        <>
          <ConnectorStatusSection
            chargePoint={chargePoint}
            availabilityState={availabilityState}
            unlockConnectorState={unlockConnectorState}
            onChangeAvailability={handleChangeAvailability}
            onUnlockConnector={handleUnlockConnector}
          />

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

          <ChargePointMetadataSection chargePoint={chargePoint} />

          <StatusHistoryPanel
            chargePointId={chargePoint.id}
            connectorIds={chargePoint.connectors.map((connector) => connector.connectorId)}
            ranges={["day"]}
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-stretch gap-4">
              <ActionsDropdown
                align="start"
                disabled={resetState.status === "loading"}
                trigger={
                  <Button variant="outline" size="sm" disabled={resetState.status === "loading"}>
                    {resetState.status === "loading" ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                    )}
                    {t("appPage.chargePoints.reset.button")}
                    <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                }
                actions={[
                  { id: "Hard", label: t("appPage.chargePoints.reset.types.hard") },
                  { id: "Soft", label: t("appPage.chargePoints.reset.types.soft") },
                ]}
                onAction={(actionId) => handleReset(actionId as ResetType)}
              />

              <ChargePointConfigurationDialog
                chargePointId={chargePoint.id}
                chargePointName={chargePoint.name}
              />

              <StatusActionDropdown
                align="start"
                currentStatus=""
                disabled={wholeChargePointAvailability.status === "loading"}
                trigger={
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
                }
                options={[
                  {
                    value: "Operative",
                    label: t("appPage.chargePoints.availability.types.operative"),
                  },
                  {
                    value: "Inoperative",
                    label: t("appPage.chargePoints.availability.types.inoperative"),
                  },
                ]}
                onStatusChange={(value) =>
                  handleChangeAvailability(WHOLE_CHARGE_POINT_KEY, 0, value as AvailabilityType)
                }
              />
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
                  description={t(getResetErrorMessageKey(resetState.outcome.httpStatus))}
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
                    getAvailabilityErrorMessageKey(wholeChargePointAvailability.outcome.httpStatus),
                  )}
                  variant="error"
                />
              ))}
          </div>
        </>
      )}

      {tab === "consumption" && <ChargePointConsumptionPanel chargePointId={chargePoint.id} />}

      {tab === "alerts" && (
        <AlertsPanel
          chargePointId={chargePoint.id}
          chargePointName={chargePoint.name}
          realtimeAlertsEnabled={chargePoint.realtimeAlertsEnabled}
          onToggleRealtimeAlerts={() => actions.toggleRealtimeAlerts()}
        />
      )}

      {tab === "security" && (
        <>
          <SecurityEventsPanel chargePointId={chargePoint.id} />

          <StatusHistoryPanel
            chargePointId={chargePoint.id}
            connectorIds={chargePoint.connectors.map((connector) => connector.connectorId)}
          />

          <LogUploadPanel chargePointId={chargePoint.id} ocppVersion={chargePoint.ocppVersion} />
        </>
      )}
    </div>
  );
};
