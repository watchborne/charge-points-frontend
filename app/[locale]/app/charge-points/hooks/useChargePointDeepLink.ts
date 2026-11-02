import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { DetailTab, isDetailTab } from "../components/ChargePointDetailPanel";

/**
 * The selected charge point, kept in step with the URL (`?id=…&tab=…`).
 *
 * A deep-linked `id` selects its charge point once, on first load, so closing
 * the detail afterwards is not undone by the still-present link. The selection
 * follows its charge point as the list refreshes, and is independent of the
 * list filters: a filter hiding the selected station does not deselect it.
 */
export const useChargePointDeepLink = ({
  chargePoints,
  loading,
}: {
  chargePoints: ChargePointWithConnectors[];
  loading: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("id") ?? undefined;
  const tabParam = searchParams.get("tab");
  // Preselects a detail tab when a charge point is deep-linked.
  const highlightedTab = tabParam && isDetailTab(tabParam) ? tabParam : undefined;
  const didAutoSwitch = useRef(false);

  const [selected, setSelected] = useState<ChargePointWithConnectors | null>(null);

  useEffect(() => {
    if (!selected) return;
    const updated = chargePoints.find((cp) => cp.id === selected.id);
    if (updated) setSelected(updated);
  }, [chargePoints, selected]);

  useEffect(() => {
    if (!highlightedId || loading || didAutoSwitch.current) return;
    const target = chargePoints.find((cp) => cp.id === highlightedId);
    if (target) {
      didAutoSwitch.current = true;
      setSelected(target);
    }
  }, [highlightedId, chargePoints, loading]);

  const select = useCallback(
    (chargePoint: ChargePointWithConnectors | null) => {
      setSelected(chargePoint);
      if (chargePoint) {
        // Selecting a charge point drops `tab`: the panel resets to "main".
        router.replace(`/app/charge-points?id=${chargePoint.id}`);
      } else {
        router.replace(`/app/charge-points`);
      }
    },
    [router],
  );

  const changeTab = useCallback(
    (tab: DetailTab) => {
      if (!selected) return;
      router.replace(`/app/charge-points?id=${selected.id}&tab=${tab}`);
    },
    [router, selected],
  );

  return {
    selected,
    select,
    changeTab,
    /** The deep-linked tab, only while the deep-linked charge point is the selected one. */
    initialTab: selected?.id === highlightedId ? highlightedTab : undefined,
  };
};
