"use client";

import { useEffect, useState } from "react";

import { isCumulativeRegister } from "@/lib/api-metering";

import { ChargePointConsumptionPanel } from "./ChargePointConsumptionPanel";
import { useConsumption, type ConsumptionRange } from "../../hooks/useConsumption";

type Props = {
  chargePointId: string;
};

/**
 * Owns the range/measurand selection and the fetch behind it
 * (`useConsumption`), handing the reduced result to
 * `ChargePointConsumptionPanel` — the data-owning half of that
 * container/presentational split.
 */
export const ChargePointConsumptionPanelContainer = ({ chargePointId }: Props) => {
  const [range, setRange] = useState<ConsumptionRange>("24h");
  const [measurand, setMeasurand] = useState<string | undefined>(undefined);

  const { consumption, samples, measurands, measurandLabels, truncated, loading, failed } =
    useConsumption(chargePointId, range, measurand);

  // The station decides which measurands exist, so selection follows the
  // data: default to the energy register ("consumption" to an installer),
  // fall back to alphabetically first. Re-runs on window change since a
  // shorter window can drop a measurand entirely.
  useEffect(() => {
    if (measurands.length === 0) return;
    if (measurand && measurands.includes(measurand)) return;

    setMeasurand(measurands.find(isCumulativeRegister) ?? measurands[0]);
  }, [measurands, measurand]);

  return (
    <ChargePointConsumptionPanel
      range={range}
      onRangeChange={setRange}
      measurand={measurand}
      onMeasurandChange={setMeasurand}
      consumption={consumption}
      samples={samples}
      measurands={measurands}
      measurandLabels={measurandLabels}
      truncated={truncated}
      loading={loading}
      failed={failed}
    />
  );
};
