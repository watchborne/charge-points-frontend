import { useCallback, useEffect, useState } from "react";

import {
  DashboardWidgetId,
  DashboardWidgetPreference,
  defaultDashboardLayout,
  readDashboardLayout,
  writeDashboardLayout,
} from "@/lib/dashboard-layout";

// The dashboard's widget order/visibility. Starts from the default (no
// localStorage during prerender), then hydrates from localStorage on mount
// and writes through on every change.
export const useDashboardLayout = () => {
  const [layout, setLayout] = useState<DashboardWidgetPreference[]>(defaultDashboardLayout());

  useEffect(() => {
    setLayout(readDashboardLayout());
  }, []);

  const persist = useCallback((next: DashboardWidgetPreference[]) => {
    setLayout(next);
    writeDashboardLayout(next);
  }, []);

  const toggleVisibility = useCallback(
    (id: DashboardWidgetId) => {
      persist(
        layout.map((entry) => (entry.id === id ? { ...entry, visible: !entry.visible } : entry)),
      );
    },
    [layout, persist],
  );

  const moveWidget = useCallback(
    (id: DashboardWidgetId, direction: "up" | "down") => {
      const index = layout.findIndex((entry) => entry.id === id);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= layout.length) return;

      const next = [...layout];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      persist(next);
    },
    [layout, persist],
  );

  const resetLayout = useCallback(() => persist(defaultDashboardLayout()), [persist]);

  return { layout, toggleVisibility, moveWidget, resetLayout };
};
