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
import { SessionConsumptionChart } from "@/app/[locale]/app/charge-points/components/SessionConsumptionChart";
import { StatusHistoryPanel } from "@/app/[locale]/app/charge-points/components/StatusHistoryPanel";
import type { ChargePointConsumption, MeterSample, MeterSampleSummary } from "@/lib/api-metering";
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
const SESSION_MEASURAND_POWER = "Power.Active.Import";

const MEASURAND_ENERGY = "Energy.Active.Import.Register";
const MEASURAND_POWER = "Power.Active.Import";
const MEASURAND_CURRENT = "Current.Import";
const MEASURAND_VOLTAGE = "Voltage";
const MEASURAND_SOC = "SoC";

/** Order doubles as the measurand selector's order. */
const CONSUMPTION_MEASURANDS = [
  MEASURAND_ENERGY,
  MEASURAND_POWER,
  MEASURAND_CURRENT,
  MEASURAND_VOLTAGE,
  MEASURAND_SOC,
] as const;

const MEASURAND_TRANSLATION_KEYS: Record<string, string> = {
  [MEASURAND_ENERGY]: "EnergyActiveImportRegister",
  [MEASURAND_POWER]: "PowerActiveImport",
  [MEASURAND_CURRENT]: "CurrentImport",
  [MEASURAND_VOLTAGE]: "Voltage",
  [MEASURAND_SOC]: "SoC",
};

type DemoConsumptionRange = "24h" | "7d" | "30d";

const RANGE_HOURS: Record<DemoConsumptionRange, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * How far apart the idle baseline readings sit, per range — coarser over a
 * longer window, the same shape a real backend thinning a long raw read
 * would have (see `useConsumption`'s `MAX_CHART_SAMPLES` comment). Sessions
 * are always densified separately (`SESSION_STEP_MS` below), so this only
 * controls how the idle-between-sessions baseline is spaced.
 */
const RANGE_IDLE_STEP_MS: Record<DemoConsumptionRange, number> = {
  "24h": 15 * MIN_MS,
  "7d": 2 * HOUR_MS,
  "30d": 8 * HOUR_MS,
};

/** Resolution inside an active session, regardless of range — a session
 * lasts under two hours, so it stays visible (ramp/plateau/taper) on every
 * range's chart instead of being aliased away by a coarser idle step. */
const SESSION_STEP_MS = 5 * MIN_MS;

/**
 * Deterministic PRNG (mulberry32). The fixture has to render identically on
 * the server and after hydration — same reasoning as everything else in
 * this file being anchored to elapsed fractions rather than wall-clock
 * reads taken twice — so it can't use `Math.random()`.
 */
const mulberry32 = (seed: number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type ConnectorProfile = {
  plateauPowerW: number;
  voltageV: number;
  /** The register reading "now" — every window's samples are computed
   * backward from this fixed point, so it never depends on which range is
   * selected (switching ranges doesn't rewind the meter). */
  lifetimeEnergyWh: number;
};

const CONNECTOR_PROFILES: Record<number, ConnectorProfile> = {
  // The busier of the two: a 7.2kW AC connector used most weekdays.
  1: { plateauPowerW: 7_200, voltageV: 230, lifetimeEnergyWh: 1_245_600 },
  // Slower and used less often.
  2: { plateauPowerW: 3_700, voltageV: 230, lifetimeEnergyWh: 341_200 },
};

type DemoSession = {
  startAt: number;
  endAt: number;
  plateauPowerW: number;
  startSoc: number;
  endSoc: number;
};

/** A calendar day always seeds the same way, whatever range is generating
 * around it — the 24h and 30d views agree on "today"'s sessions. */
const daySeed = (dayStartMs: number, connectorId: number) =>
  Math.floor(dayStartMs / DAY_MS) * 4 + connectorId;

/**
 * A charging-session schedule for one connector: weekday mornings and
 * afternoons for connector 1 (a busy AC charger), an occasional evening
 * session for connector 2 — never every day, never at the same minute twice.
 */
const buildSessions = (connectorId: number, windowStart: number, now: number): DemoSession[] => {
  const profile = CONNECTOR_PROFILES[connectorId];
  const sessions: DemoSession[] = [];

  const firstDay = new Date(windowStart);
  firstDay.setHours(0, 0, 0, 0);

  for (let dayStart = firstDay.getTime(); dayStart <= now; dayStart += DAY_MS) {
    const rng = mulberry32(daySeed(dayStart, connectorId));
    const weekday = new Date(dayStart).getDay();
    const isWeekday = weekday >= 1 && weekday <= 5;
    const slots: { hour: number; durationMin: number }[] = [];

    if (connectorId === 1) {
      if (isWeekday || rng() < 0.25) {
        slots.push({ hour: 7.5 + rng() * 1.5, durationMin: 45 + rng() * 30 });
      }
      if (isWeekday && rng() < 0.85) {
        slots.push({ hour: 13 + rng() * 1.5, durationMin: 45 + rng() * 45 });
      }
    } else if (rng() < 0.4) {
      slots.push({ hour: 18 + rng() * 2.5, durationMin: 75 + rng() * 60 });
    }

    for (const slot of slots) {
      const startAt = dayStart + slot.hour * HOUR_MS;
      const endAt = Math.min(startAt + slot.durationMin * MIN_MS, now);
      if (endAt <= windowStart || startAt >= now) continue;

      const startSoc = 15 + rng() * 30;
      sessions.push({
        startAt: Math.max(startAt, windowStart),
        endAt,
        plateauPowerW: profile.plateauPowerW * (0.9 + rng() * 0.15),
        startSoc,
        endSoc: Math.min(99, startSoc + 35 + rng() * 40),
      });
    }
  }

  return sessions;
};

/** Power at an instant within a session: ramps up, holds a plateau, tapers
 * off as the vehicle approaches full — never a flat step function. */
const sessionPowerAt = (session: DemoSession, t: number): number => {
  const duration = session.endAt - session.startAt;
  if (duration <= 0) return 0;

  const elapsed = t - session.startAt;
  const rampMs = Math.min(8 * MIN_MS, duration * 0.2);
  const taperMs = Math.min(15 * MIN_MS, duration * 0.3);
  const taperStart = duration - taperMs;

  if (elapsed < rampMs) return session.plateauPowerW * (elapsed / rampMs);
  if (elapsed > taperStart) {
    const taperFraction = (elapsed - taperStart) / taperMs;
    return session.plateauPowerW * (1 - taperFraction * 0.75);
  }
  return session.plateauPowerW;
};

/** Diminishing-rate charging curve: SoC climbs fast early, slows near full. */
const sessionSocAt = (session: DemoSession, t: number): number => {
  const duration = session.endAt - session.startAt;
  const fraction = duration > 0 ? (t - session.startAt) / duration : 1;
  const eased = 1 - (1 - fraction) ** 1.6;
  return session.startSoc + (session.endSoc - session.startSoc) * eased;
};

const activeSessionAt = (sessions: DemoSession[], t: number): DemoSession | undefined =>
  sessions.find((session) => t >= session.startAt && t <= session.endAt);

type ConnectorSeries = Record<(typeof CONSUMPTION_MEASURANDS)[number], MeterSample[]>;

/** One connector's full multi-measurand history over a window. */
const buildConnectorSeries = (
  connectorId: number,
  windowStart: number,
  now: number,
  idleStepMs: number,
  rng: () => number,
): ConnectorSeries => {
  const profile = CONNECTOR_PROFILES[connectorId];
  const sessions = buildSessions(connectorId, windowStart, now);

  // The idle baseline grid, plus every session densified to 5-minute steps
  // so ramp/plateau/taper stay visible regardless of the range's idle
  // resolution — a coarse 30d grid could otherwise step clean over a
  // 45-minute session and miss it entirely.
  const times = new Set<number>();
  for (let t = windowStart; t <= now; t += idleStepMs) times.add(t);
  times.add(now);
  for (const session of sessions) {
    for (let t = session.startAt; t <= session.endAt; t += SESSION_STEP_MS) times.add(t);
    times.add(session.endAt);
  }
  const sortedTimes = [...times].sort((a, b) => a - b);

  const makeSample = (measurand: string, unit: string, t: number, value: number): MeterSample => ({
    id: `${measurand}-c${connectorId}-${t}`,
    chargePointId: DEMO_CHARGE_POINT_ID,
    connectorId,
    measuredAt: new Date(t).toISOString(),
    measurand,
    unit,
    value,
    createdAt: new Date(t).toISOString(),
  });

  const power: MeterSample[] = [];
  const current: MeterSample[] = [];
  const voltage: MeterSample[] = [];
  const soc: MeterSample[] = [];
  const runningWh: number[] = [];

  let previousT = windowStart;
  let cumulativeWh = 0;

  for (const t of sortedTimes) {
    const session = activeSessionAt(sessions, t);
    const noise = 1 + (rng() - 0.5) * 0.04;
    const powerW = Math.max(0, (session ? sessionPowerAt(session, t) : 0) * noise);

    power.push(makeSample(MEASURAND_POWER, "W", t, Math.round(powerW)));

    // A charger still draws a small idle current for its own electronics
    // even with nothing plugged in.
    const currentA = powerW > 0 ? powerW / profile.voltageV : 0.05 + rng() * 0.1;
    current.push(makeSample(MEASURAND_CURRENT, "A", t, Number(currentA.toFixed(1))));

    // Mains sags slightly under load — never a lot, never exactly flat.
    const sagV = (powerW / profile.plateauPowerW) * 1.5;
    const voltageV = profile.voltageV - sagV + (rng() - 0.5) * 1.5;
    voltage.push(makeSample(MEASURAND_VOLTAGE, "V", t, Number(voltageV.toFixed(1))));

    if (session) {
      soc.push(makeSample(MEASURAND_SOC, "%", t, Number(sessionSocAt(session, t).toFixed(1))));
    }

    // Rectangular integration between consecutive timestamps — accurate
    // enough since every session is already densified to 5-minute steps
    // above, so no interval spans a ramp/taper unnoticed.
    cumulativeWh += powerW * ((t - previousT) / HOUR_MS);
    previousT = t;
    runningWh.push(cumulativeWh);
  }

  const totalWh = runningWh[runningWh.length - 1] ?? 0;
  const energy = sortedTimes.map((t, index) =>
    makeSample(
      MEASURAND_ENERGY,
      "Wh",
      t,
      Math.round(profile.lifetimeEnergyWh - totalWh + runningWh[index]),
    ),
  );

  return {
    [MEASURAND_ENERGY]: energy,
    [MEASURAND_POWER]: power,
    [MEASURAND_CURRENT]: current,
    [MEASURAND_VOLTAGE]: voltage,
    [MEASURAND_SOC]: soc,
  };
};

const buildConsumptionFixture = (
  range: DemoConsumptionRange,
): { consumption: ChargePointConsumption; samples: MeterSample[] } => {
  const now = Date.now();
  const windowStart = now - RANGE_HOURS[range] * HOUR_MS;
  const idleStepMs = RANGE_IDLE_STEP_MS[range];

  const allSamples: MeterSample[] = [];
  const summaries: ChargePointConsumption["series"] = [];

  for (const connectorId of DEMO_CONNECTOR_IDS) {
    // Seeded per connector+range, not per render, so the shape is stable
    // across re-renders (a re-render from unrelated state shouldn't reshuffle
    // the chart) while still varying between connectors and ranges.
    const rng = mulberry32(connectorId * 7_919 + RANGE_HOURS[range]);
    const series = buildConnectorSeries(connectorId, windowStart, now, idleStepMs, rng);

    for (const measurand of CONSUMPTION_MEASURANDS) {
      const samples = series[measurand];
      allSamples.push(...samples);
      if (samples.length === 0) continue;

      const values = samples.map((sample) => sample.value);
      summaries.push({
        connectorId,
        measurand,
        unit: samples[0].unit,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, value) => sum + value, 0) / values.length,
        sampleCount: values.length,
        firstMeasuredAt: samples[0].measuredAt,
        lastMeasuredAt: samples[samples.length - 1].measuredAt,
      });
    }
  }

  return {
    consumption: {
      chargePointId: DEMO_CHARGE_POINT_ID,
      from: new Date(windowStart).toISOString(),
      to: new Date(now).toISOString(),
      series: summaries,
    },
    samples: allSamples,
  };
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

/**
 * A charging session's own meter readings, fed to the presentational
 * `SessionConsumptionChart` — the marketing preview's counterpart to
 * `SessionConsumptionChartContainer`'s real fetch, scoped to a real,
 * synthetic session rather than one that doesn't exist on the backend.
 * Power ramps up, holds a plateau, then tapers off toward the session's
 * end (or "now", for the still-active demo session) rather than a flat
 * step function; Energy is that Power curve's own integral, so it only
 * ever counts up, same as the real register would.
 */
const buildSessionConsumptionFixture = (
  connectorId: number,
  startedAt: Date | string,
  endedAt: Date | string | null,
): { series: MeterSampleSummary[]; samples: MeterSample[] } => {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const duration = Math.max(end - start, 60_000);
  const stepMs = 5 * 60 * 1000;
  const plateauPowerW = connectorId === 1 ? 7_200 : 3_700;
  const registerBaselineWh = connectorId === 1 ? 12_400 : 8_100;

  const rampMs = Math.min(8 * 60 * 1000, duration * 0.2);
  const taperMs = Math.min(15 * 60 * 1000, duration * 0.3);
  const taperStart = duration - taperMs;

  const powerAt = (t: number) => {
    const elapsed = t - start;
    if (elapsed < rampMs) return plateauPowerW * (elapsed / rampMs);
    if (elapsed > taperStart) {
      const taperFraction = (elapsed - taperStart) / taperMs;
      return plateauPowerW * (1 - taperFraction * 0.75);
    }
    return plateauPowerW;
  };

  const times: number[] = [];
  for (let t = start; t <= end; t += stepMs) times.push(t);
  if (times[times.length - 1] !== end) times.push(end);

  const makeSample = (measurand: string, unit: string, t: number, value: number): MeterSample => ({
    id: `${measurand}-c${connectorId}-${t}`,
    chargePointId: DEMO_CHARGE_POINT_ID,
    connectorId,
    measuredAt: new Date(t).toISOString(),
    measurand,
    unit,
    value,
    createdAt: new Date(t).toISOString(),
  });

  const power: MeterSample[] = [];
  const energy: MeterSample[] = [];
  let previousT = start;
  let cumulativeWh = 0;

  for (const t of times) {
    const powerW = Math.max(0, powerAt(t));
    power.push(makeSample(SESSION_MEASURAND_POWER, "W", t, Math.round(powerW)));

    cumulativeWh += powerW * ((t - previousT) / (60 * 60 * 1000));
    previousT = t;
    energy.push(
      makeSample(
        CONSUMPTION_MEASURAND,
        CONSUMPTION_UNIT,
        t,
        Math.round(registerBaselineWh + cumulativeWh),
      ),
    );
  }

  const summarize = (samples: MeterSample[]): MeterSampleSummary => {
    const values = samples.map((sample) => sample.value);
    return {
      connectorId,
      measurand: samples[0].measurand,
      unit: samples[0].unit,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, value) => sum + value, 0) / values.length,
      sampleCount: values.length,
      firstMeasuredAt: samples[0].measuredAt,
      lastMeasuredAt: samples[samples.length - 1].measuredAt,
    };
  };

  return {
    series: [summarize(energy), summarize(power)],
    samples: [...energy, ...power],
  };
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
  const [consumptionRange, setConsumptionRange] = useState<DemoConsumptionRange>("24h");
  const [measurand, setMeasurand] = useState<string>(MEASURAND_ENERGY);

  // Status-history range/connector selection, mirroring what
  // StatusHistoryPanelContainer owns for the real dashboard.
  const [connectorId, setConnectorId] = useState(DEMO_CONNECTOR_IDS[0]);

  const statusHistory = useMemo(() => buildStatusHistoryFixture(), []);
  // Regenerated per range, the same way ChargePointConsumptionPanelContainer
  // re-fetches on a range change — a 30-day view needs a 30-day history, not
  // the 24h fixture stretched to fit.
  const { consumption, samples: consumptionSamples } = useMemo(
    () => buildConsumptionFixture(consumptionRange),
    [consumptionRange],
  );
  // Real stations only ever hand `ChargePointConsumptionPanel` samples for
  // the one measurand currently selected (`useConsumption`'s raw read is
  // itself scoped to `measurand`) — filter here too, or switching measurand
  // in this preview would plot every series' values as one connector line.
  const consumptionChartSamples = useMemo(
    () => consumptionSamples.filter((sample) => sample.measurand === measurand),
    [consumptionSamples, measurand],
  );
  const measurandLabels = useMemo(
    () =>
      Object.fromEntries(
        CONSUMPTION_MEASURANDS.map((option) => [
          option,
          t(`appPage.chargePoints.consumption.measurands.${MEASURAND_TRANSLATION_KEYS[option]}`),
        ]),
      ),
    [t],
  );
  const sessions = useMemo(() => buildSessionsFixture(), []);
  const alerts = useMemo(() => buildAlertsFixture(), []);

  return (
    <div className="rounded-3xl border bg-muted/30 p-6 md:p-10">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as PreviewTab)}
        className="overflow-auto"
      >
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
            samples={consumptionChartSamples}
            measurands={[...CONSUMPTION_MEASURANDS]}
            measurandLabels={measurandLabels}
            truncated={false}
          />
        )}

        {tab === "sessions" && (
          <ChargingSessionsPanel
            chargePointId={DEMO_CHARGE_POINT_ID}
            sessions={sessions}
            renderSessionDetail={(session) => {
              const { series, samples: sessionSamples } = buildSessionConsumptionFixture(
                session.connectorId,
                session.startedAt,
                session.endedAt,
              );

              return (
                <SessionConsumptionChart
                  connectorId={session.connectorId}
                  startedAt={session.startedAt}
                  endedAt={session.endedAt}
                  series={series}
                  samples={sessionSamples}
                />
              );
            }}
          />
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
