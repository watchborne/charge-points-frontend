"use client";

import { ChargePointStats } from "../components/charge-points/ChargePointStats";
import { ChargePointsGrid } from "../components/charge-points/ChargePointsGrid";
import { EmptyStateChargePoints } from "../components/charge-points/EmptyStateChargePoints";
import { Callout } from "../components/common/Callout";
import { Loader } from "../components/common/Loader";
import { useChargePoints } from "../hooks/useChargePoints";

export default function DashboardPage() {
  const { chargePoints, loading, error } = useChargePoints();

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && <Callout error={error} />}

      {loading && <Loader label="Loading charge points..." />}

      {/* Stats Cards */}
      {!loading && !error && (
        <>
          <ChargePointStats chargePoints={chargePoints} />

          <div>
            <h2 className="text-xl font-semibold mb-4">Charge points ({chargePoints.length})</h2>
            {chargePoints.length === 0 ? (
              <EmptyStateChargePoints />
            ) : (
              <ChargePointsGrid chargePoints={chargePoints} />
            )}
          </div>
        </>
      )}
    </main>
  );
}
