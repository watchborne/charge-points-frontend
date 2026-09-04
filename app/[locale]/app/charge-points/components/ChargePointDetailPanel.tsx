import { AvailabilityType, ResetType, Site } from "@watchborne/charge-points-types";
import { Callout, Tag, Tabs, TabsList, TabsTrigger } from "@watchborne/electrons";
import { formatDistanceToNow, format } from "date-fns";
import { enGB } from "date-fns/locale";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { AlertsPanelContainer } from "./AlertsPanelContainer";
import { ChargePointActionsSection } from "./ChargePointActionsSection";
import { ChargePointConsumptionPanelContainer } from "./ChargePointConsumptionPanelContainer";
import { ChargePointHeaderSection } from "./ChargePointHeaderSection";
import { ChargePointMetadataSection } from "./ChargePointMetadataSection";
import { ChargePointReliabilityTile } from "./ChargePointReliabilityTile";
import { ChargingSessionsPanelContainer } from "./ChargingSessionsPanelContainer";
import { ConnectorStatusSection } from "./ConnectorStatusSection";
import { DeviceEventsPanel } from "./DeviceEventsPanel";
import { DeviceVariableReportsPanel } from "./DeviceVariableReportsPanel";
import { LogUploadPanel } from "./LogUploadPanel";
import { SecurityEventsPanel } from "./SecurityEventsPanel";
import { StatusHistoryPanelContainer } from "./StatusHistoryPanelContainer";
import { useChargePointActions } from "../hooks/useChargePointActions";

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

type DetailTab = "main" | "actions" | "consumption" | "sessions" | "alerts" | "security";
const DETAIL_TABS: readonly DetailTab[] = [
  "main",
  "actions",
  "consumption",
  "sessions",
  "alerts",
  "security",
];

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

          <ChargePointReliabilityTile chargePointId={chargePoint.id} />

          <StatusHistoryPanelContainer
            chargePointId={chargePoint.id}
            connectorIds={chargePoint.connectors.map((connector) => connector.connectorId)}
            ranges={["day"]}
          />
        </>
      )}

      {tab === "actions" && (
        <ChargePointActionsSection
          chargePointId={chargePoint.id}
          chargePointName={chargePoint.name}
          resetState={resetState}
          onReset={handleReset}
          wholeChargePointAvailability={wholeChargePointAvailability}
          onChangeAvailability={(type) => handleChangeAvailability(WHOLE_CHARGE_POINT_KEY, 0, type)}
        />
      )}

      {tab === "consumption" && (
        <ChargePointConsumptionPanelContainer chargePointId={chargePoint.id} />
      )}

      {tab === "sessions" && <ChargingSessionsPanelContainer chargePointId={chargePoint.id} />}

      {tab === "alerts" && (
        <AlertsPanelContainer
          chargePointId={chargePoint.id}
          chargePointName={chargePoint.name}
          realtimeAlertsEnabled={chargePoint.realtimeAlertsEnabled}
          onToggleRealtimeAlerts={() => actions.toggleRealtimeAlerts()}
        />
      )}

      {tab === "security" && (
        <>
          <SecurityEventsPanel chargePointId={chargePoint.id} />

          {chargePoint.ocppVersion === "2.0.1" && (
            <>
              <DeviceEventsPanel chargePointId={chargePoint.id} />
              <DeviceVariableReportsPanel chargePointId={chargePoint.id} />
            </>
          )}

          <StatusHistoryPanelContainer
            chargePointId={chargePoint.id}
            connectorIds={chargePoint.connectors.map((connector) => connector.connectorId)}
          />

          <LogUploadPanel chargePointId={chargePoint.id} ocppVersion={chargePoint.ocppVersion} />
        </>
      )}
    </div>
  );
};
