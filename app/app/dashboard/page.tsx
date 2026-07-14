"use client";

import { useTranslations } from "next-intl";

import { ChargePointStats } from "../components/charge-points/ChargePointStats";
import { ChargePointsGrid } from "../components/charge-points/ChargePointsGrid";
import { EmptyStateChargePoints } from "../components/charge-points/EmptyStateChargePoints";
import { Callout } from "../components/common/Callout";
import { Loader } from "../components/common/Loader";
import { useChargePoints } from "../hooks/useChargePoints";

export default function DashboardPage() {
  const t = useTranslations("");
  const { chargePoints, loading, error } = useChargePoints();

  return (
    <>
      {error && <Callout error={error} />}

      {loading && <Loader label={t("appPage.loading.chargePoints")} />}

      {!loading && !error && (
        <>
          <ChargePointStats chargePoints={chargePoints} />

          <div>
            <h2 className="text-xl font-semibold mb-4">
              {t("misc.chargePoint_plural")} ({chargePoints.length})
            </h2>
            {chargePoints.length === 0 ? (
              <EmptyStateChargePoints />
            ) : (
              <ChargePointsGrid chargePoints={chargePoints} />
            )}
          </div>
        </>
      )}
    </>
  );
}
