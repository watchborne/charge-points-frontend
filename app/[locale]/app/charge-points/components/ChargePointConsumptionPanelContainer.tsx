"use client";

import { Callout, Skeleton } from "@watchborne/electrons";
import { useTranslations } from "next-intl";
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
 * container/presentational split. Also owns the loading/error templates, so
 * `ChargePointConsumptionPanel` only ever renders the loaded data.
 */
export const ChargePointConsumptionPanelContainer = ({ chargePointId }: Props) => {
  const t = useTranslations("");

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

  if (failed) {
    return <Callout description={t("errors.loadingConsumption")} variant="error" />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[220px] w-full" />
      </div>
    );
  }

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
    />
  );
};
