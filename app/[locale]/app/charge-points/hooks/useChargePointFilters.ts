import { useMemo, useState } from "react";

import { isAwaitingCommissioning } from "@/lib/commissioning";
import { ChargePointConnectionStatus, ChargePointWithConnectors } from "@/types/charge-point";

/** Shortest search that filters: one or two characters match too much to help. */
const MIN_SEARCH_LENGTH = 3;

/** The fleet list's filter state and what it derives from the full list. */
export const useChargePointFilters = (chargePoints: ChargePointWithConnectors[]) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChargePointConnectionStatus | "all">("all");
  const [ocppVersionFilter, setOcppVersionFilter] = useState<string>("all");

  // The commissioning backlog, from the full list (not the filtered one).
  const awaitingCommissioning = useMemo(
    () => chargePoints.filter(isAwaitingCommissioning),
    [chargePoints],
  );

  // The OCPP versions present in the fleet, not a static list.
  const ocppVersionOptions = useMemo(
    () => [...new Set(chargePoints.map((cp) => cp.ocppVersion))].sort(),
    [chargePoints],
  );

  const filteredChargePoints = useMemo(() => {
    let result = chargePoints;

    if (statusFilter !== "all") {
      result = result.filter((cp) => cp.connection.status === statusFilter);
    }

    if (ocppVersionFilter !== "all") {
      result = result.filter((cp) => cp.ocppVersion === ocppVersionFilter);
    }

    if (search.length >= MIN_SEARCH_LENGTH) {
      const query = search.toLowerCase();
      result = result.filter(
        (cp) =>
          cp.name.toLowerCase().includes(query) ||
          cp.meta?.vendor?.toLowerCase().includes(query) ||
          cp.meta?.model?.toLowerCase().includes(query) ||
          cp.meta?.serialNumber?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [chargePoints, search, statusFilter, ocppVersionFilter]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    ocppVersionFilter,
    setOcppVersionFilter,
    ocppVersionOptions,
    awaitingCommissioning,
    filteredChargePoints,
  };
};
