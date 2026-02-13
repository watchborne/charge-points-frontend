"use client";

import { useChargePoints } from "./hooks/useChargePoints";

import { Header } from "./components/layout/Header";
import { ErrorCallout } from "./components/common/ErrorCallout";
import { Loader } from "./components/common/Loader";
import { ChargePointStats } from "./components/charge-points/ChargePointStats";
import { EmptyStateChargePoints } from "./components/charge-points/EmptyStateChargePoints";
import { ChargePointsGrid } from "./components/charge-points/ChargePointsGrid";

export default function DashboardPage() {
  const { chargePoints, loading, error } = useChargePoints();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorCallout error={error} />}

        {loading && <Loader label="Loading charge points..." />}

        {/* Stats Cards */}
        {!loading && !error && (
          <>
            <ChargePointStats chargePoints={chargePoints} />

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Charge points ({chargePoints.length})
              </h2>
              {chargePoints.length === 0 ? (
                <EmptyStateChargePoints />
              ) : (
                <ChargePointsGrid chargePoints={chargePoints} />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
