"use client";

import { Tabs, TabsList, TabsTrigger } from "@watchborne/electrons";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AlertsPanel,
  type AlertListEntry,
} from "@/app/[locale]/app/charge-points/components/AlertsPanel";
import { ChargePointConsumptionPanel } from "@/app/[locale]/app/charge-points/components/ChargePointConsumptionPanel";
import {
  ChargingSessionsPanel,
  type ChargingSessionListEntry,
} from "@/app/[locale]/app/charge-points/components/ChargingSessionsPanel";
import { StatusHistoryPanel } from "@/app/[locale]/app/charge-points/components/StatusHistoryPanel";
import type { ChargePointConsumption, MeterSample } from "@/lib/api-metering";
import type { ConnectionStateEvent, ConnectorStatusEvent } from "@/lib/api-status-history";

type PreviewTab = "main" | "consumption" | "sessions" | "alerts";

const PREVIEW_TABS: readonly PreviewTab[] = ["main", "consumption", "sessions", "alerts"];

/** Inert identifiers for the fixture data below — never sent over the network. */
const DEMO_CHARGE_POINT_ID = "demo-cp-01";
const DEMO_CHARGE_POINT_NAME = "CP-014";
const DEMO_CONNECTOR_IDS = [1, 2];
const DEMO_STATUS_HISTORY_RANGES = ["day"] as const;

/**
 * Builds the `StatusHistoryPanel` fixture as fractions of "today so far"
 * rather than fixed clock times, so the timeline always lands inside the
 * "day" window this preview locks to, whatever time of day this loads.
 */
const buildStatusHistoryFixture = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const elapsedMs = Math.max(Date.now() - start.getTime(), 60_000);
  const at = (fraction: number) => new Date(start.getTime() + elapsedMs * fraction).toISOString();
  const windowEnd = new Date(start.getTime() + elapsedMs);

  const connectionEvents: ConnectionStateEvent[] = [
    {
      id: "seed-connection",
      chargePointId: DEMO_CHARGE_POINT_ID,
      status: "SYNCED",
      previousStatus: null,
      occurredAt: at(0),
      createdAt: at(0),
    },
    {
      id: "warning",
      chargePointId: DEMO_CHARGE_POINT_ID,
      status: "WARNING",
      previousStatus: "SYNCED",
      occurredAt: at(0.55),
      createdAt: at(0.55),
    },
    {
      id: "recovered",
      chargePointId: DEMO_CHARGE_POINT_ID,
      status: "SYNCED",
      previousStatus: "WARNING",
      occurredAt: at(0.6),
      createdAt: at(0.6),
    },
  ];

  const connector1Events: ConnectorStatusEvent[] = [
    {
      id: "c1-seed",
      chargePointId: DEMO_CHARGE_POINT_ID,
      connectorId: 1,
      status: "Available",
      previousStatus: null,
      occurredAt: at(0),
      createdAt: at(0),
    },
    {
      id: "c1-charging",
      chargePointId: DEMO_CHARGE_POINT_ID,
      connectorId: 1,
      status: "Charging",
      previousStatus: "Available",
      occurredAt: at(0.35),
      createdAt: at(0.35),
    },
    {
      id: "c1-available",
      chargePointId: DEMO_CHARGE_POINT_ID,
      connectorId: 1,
      status: "Available",
      previousStatus: "Charging",
      occurredAt: at(0.8),
      createdAt: at(0.8),
    },
  ];

  const connector2Events: ConnectorStatusEvent[] = [
    {
      id: "c2-seed",
      chargePointId: DEMO_CHARGE_POINT_ID,
      connectorId: 2,
      status: "Available",
      previousStatus: null,
      occurredAt: at(0),
      createdAt: at(0),
    },
  ];

  return {
    windowStart: start,
    windowEnd,
    connectionEvents,
    connectorEventsByConnector: { 1: connector1Events, 2: connector2Events } as Record<
      number,
      ConnectorStatusEvent[]
    >,
  };
};

const CONSUMPTION_MEASURAND = "Energy.Active.Import.Register";
const CONSUMPTION_UNIT = "Wh";

const buildConsumptionFixture = (): {
  consumption: ChargePointConsumption;
  samples: MeterSample[];
} => {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const hoursBack = [12, 10, 8, 6, 4, 2, 0];
  const connectorValues: Record<number, number[]> = {
    1: [12_000, 12_180, 12_420, 12_690, 12_980, 13_210, 13_450],
    2: [8_000, 8_090, 8_210, 8_340, 8_420, 8_510, 8_600],
  };

  const samples: MeterSample[] = DEMO_CONNECTOR_IDS.flatMap((connectorId) =>
    connectorValues[connectorId].map((value, index) => ({
      id: `c${connectorId}-sample-${index}`,
      chargePointId: DEMO_CHARGE_POINT_ID,
      connectorId,
      measuredAt: hoursAgo(hoursBack[index]),
      measurand: CONSUMPTION_MEASURAND,
      unit: CONSUMPTION_UNIT,
      value,
      createdAt: hoursAgo(hoursBack[index]),
    })),
  );

  const consumption: ChargePointConsumption = {
    chargePointId: DEMO_CHARGE_POINT_ID,
    from: hoursAgo(12),
    to: hoursAgo(0),
    series: DEMO_CONNECTOR_IDS.map((connectorId) => {
      const values = connectorValues[connectorId];
      return {
        connectorId,
        measurand: CONSUMPTION_MEASURAND,
        unit: CONSUMPTION_UNIT,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, value) => sum + value, 0) / values.length,
        sampleCount: values.length,
        firstMeasuredAt: hoursAgo(12),
        lastMeasuredAt: hoursAgo(0),
      };
    }),
  };

  return { consumption, samples };
};

const buildSessionsFixture = (): ChargingSessionListEntry[] => {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "session-1",
      connectorId: 1,
      status: "ACTIVE",
      startedAt: hoursAgo(0.8),
      endedAt: null,
      meterStart: 12_450,
    },
    {
      id: "session-2",
      connectorId: 2,
      status: "ENDED",
      startedAt: hoursAgo(5),
      endedAt: hoursAgo(3.2),
      stoppedReason: "EVDisconnected",
      meterStart: 8_120,
      meterStop: 8_600,
    },
  ];
};

const buildAlertsFixture = (): AlertListEntry[] => {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "alert-1",
      type: "OFFLINE",
      status: "OPEN",
      connectorId: null,
      openedAt: hoursAgo(0.5),
      resolvedAt: null,
      notificationCount: 1,
      lastNotifiedAt: hoursAgo(0.5),
      notifiedRecipients: [{ email: "team@example.com" }],
    },
    {
      id: "alert-2",
      type: "CONNECTOR_FAULTED",
      status: "RESOLVED",
      connectorId: 1,
      openedAt: hoursAgo(30),
      resolvedAt: hoursAgo(29),
      notificationCount: 1,
      lastNotifiedAt: hoursAgo(30),
      notifiedRecipients: [{ email: "team@example.com" }],
    },
  ];
};

/**
 * The homepage/features tab switcher showing what a charge point's real
 * detail panel looks like. Renders the actual presentational dashboard
 * components (`StatusHistoryPanel`, `ChargePointConsumptionPanel`,
 * `ChargingSessionsPanel`, `AlertsPanel`) rather than a lookalike, fed static
 * fixture data as props — those panels are container/presentational-split,
 * so this is exactly the role their real `*Container` counterparts play on
 * the dashboard, just with fixtures standing in for a fetch. The marketing
 * site is public and statically rendered, so nothing here calls the backend.
 */
export const ChargePointPreviewTabs = () => {
  const t = useTranslations("");
  const [tab, setTab] = useState<PreviewTab>("main");
  const [realtimeAlertsEnabled, setRealtimeAlertsEnabled] = useState(true);

  // Consumption view/measurand selection, mirroring what
  // ChargePointConsumptionPanelContainer owns for the real dashboard.
  const [consumptionRange, setConsumptionRange] = useState<"24h" | "7d" | "30d">("24h");
  const [measurand, setMeasurand] = useState(CONSUMPTION_MEASURAND);

  // Status-history range/connector selection, mirroring what
  // StatusHistoryPanelContainer owns for the real dashboard.
  const [connectorId, setConnectorId] = useState(DEMO_CONNECTOR_IDS[0]);

  const statusHistory = useMemo(() => buildStatusHistoryFixture(), []);
  const { consumption, samples } = useMemo(() => buildConsumptionFixture(), []);
  const sessions = useMemo(() => buildSessionsFixture(), []);
  const alerts = useMemo(() => buildAlertsFixture(), []);

  return (
    <div className="rounded-3xl border bg-muted/30 p-6 md:p-10">
      <Tabs value={tab} onValueChange={(value) => setTab(value as PreviewTab)}>
        <TabsList>
          {PREVIEW_TABS.map((option) => (
            <TabsTrigger key={option} value={option}>
              {t(`appPage.chargePoints.detail.tabs.${option}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6 rounded-2xl border bg-background p-6">
        {tab === "main" && (
          <StatusHistoryPanel
            range="day"
            ranges={DEMO_STATUS_HISTORY_RANGES}
            onRangeChange={() => {}}
            connectorId={connectorId}
            connectorIds={DEMO_CONNECTOR_IDS}
            onConnectorIdChange={setConnectorId}
            windowStart={statusHistory.windowStart}
            windowEnd={statusHistory.windowEnd}
            connectionEvents={statusHistory.connectionEvents}
            connectorEvents={statusHistory.connectorEventsByConnector[connectorId] ?? []}
            truncated={false}
          />
        )}

        {tab === "consumption" && (
          <ChargePointConsumptionPanel
            range={consumptionRange}
            onRangeChange={setConsumptionRange}
            measurand={measurand}
            onMeasurandChange={setMeasurand}
            consumption={consumption}
            samples={samples}
            measurands={[CONSUMPTION_MEASURAND]}
            measurandLabels={{
              [CONSUMPTION_MEASURAND]: t(
                "appPage.chargePoints.consumption.measurands.EnergyActiveImportRegister",
              ),
            }}
            truncated={false}
          />
        )}

        {tab === "sessions" && (
          <ChargingSessionsPanel chargePointId={DEMO_CHARGE_POINT_ID} sessions={sessions} />
        )}

        {tab === "alerts" && (
          <AlertsPanel
            chargePointName={DEMO_CHARGE_POINT_NAME}
            realtimeAlertsEnabled={realtimeAlertsEnabled}
            onToggleRealtimeAlerts={() => setRealtimeAlertsEnabled((enabled) => !enabled)}
            alerts={alerts}
          />
        )}
      </div>
    </div>
  );
};
