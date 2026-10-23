// The dashboard's widget visibility and order, stored in localStorage: a
// per-browser presentation preference.

import { safeLocalStorage } from "./safe-local-storage";

export type DashboardWidgetId =
  "siteHealth" | "chargePointsBreakdown" | "fleetOverview" | "fleetReliability";

export type DashboardWidgetPreference = {
  id: DashboardWidgetId;
  visible: boolean;
};

// Also the default order; a widget added later is appended by `sanitize`.
export const DASHBOARD_WIDGET_IDS: DashboardWidgetId[] = [
  "siteHealth",
  "chargePointsBreakdown",
  "fleetOverview",
  "fleetReliability",
];

const STORAGE_KEY = "dashboard-layout";

const isDashboardWidgetId = (value: unknown): value is DashboardWidgetId =>
  typeof value === "string" && (DASHBOARD_WIDGET_IDS as string[]).includes(value);

export const defaultDashboardLayout = (): DashboardWidgetPreference[] =>
  DASHBOARD_WIDGET_IDS.map((id) => ({ id, visible: true }));

// Drops unknown ids (removed widgets) and appends missing ones (new widgets)
// as visible.
const sanitize = (stored: unknown): DashboardWidgetPreference[] => {
  const known = Array.isArray(stored)
    ? stored.filter(
        (entry): entry is DashboardWidgetPreference =>
          isDashboardWidgetId(entry?.id) && typeof entry?.visible === "boolean",
      )
    : [];

  const seenIds = new Set(known.map((entry) => entry.id));
  const missing = DASHBOARD_WIDGET_IDS.filter((id) => !seenIds.has(id)).map((id) => ({
    id,
    visible: true,
  }));

  return [...known, ...missing];
};

export const readDashboardLayout = (): DashboardWidgetPreference[] => {
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultDashboardLayout();

  try {
    return sanitize(JSON.parse(stored));
  } catch {
    return defaultDashboardLayout();
  }
};

export const writeDashboardLayout = (layout: DashboardWidgetPreference[]) => {
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
};
