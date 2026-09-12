// Client-side preference store for the dashboard's widget layout (#393):
// which of the dashboard's panels a user sees and in what order. Persisted
// to localStorage rather than a backend preferences blob, since this is
// purely a presentation-layer preference scoped to this device/browser —
// a true per-user, cross-device store would share the backend mechanism
// the per-user notification-preferences feature uses (charge-points-server),
// which is out of scope here.

export type DashboardWidgetId = "siteHealth" | "chargePointsBreakdown" | "fleetOverview";

export type DashboardWidgetPreference = {
  id: DashboardWidgetId;
  visible: boolean;
};

// Order here doubles as the default layout — unchanged from the dashboard's
// previous fixed arrangement.
export const DASHBOARD_WIDGET_IDS: DashboardWidgetId[] = [
  "siteHealth",
  "chargePointsBreakdown",
  "fleetOverview",
];

const STORAGE_KEY = "dashboard-layout";

const isDashboardWidgetId = (value: unknown): value is DashboardWidgetId =>
  typeof value === "string" && (DASHBOARD_WIDGET_IDS as string[]).includes(value);

export const defaultDashboardLayout = (): DashboardWidgetPreference[] =>
  DASHBOARD_WIDGET_IDS.map((id) => ({ id, visible: true }));

// Reconciles stored preferences against the widgets this build actually
// knows about: drops ids it no longer recognizes (a removed widget), and
// appends any id it doesn't find (a widget shipped after these preferences
// were saved) as visible, rather than losing it silently.
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
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultDashboardLayout();

  try {
    return sanitize(JSON.parse(stored));
  } catch {
    return defaultDashboardLayout();
  }
};

export const writeDashboardLayout = (layout: DashboardWidgetPreference[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
};
