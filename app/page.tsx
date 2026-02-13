"use client";

import { useEffect, useState } from "react";
import { Battery } from "lucide-react";

import { api } from "@/lib/api";
import { ChargePoint } from "@/types";
import { ChargePointCard } from "./components/charge-point/ChargePointCard";
import { Header } from "./components/layout/Header";
import { ErrorCallout } from "./components/common/ErrorCallout";
import { Loader } from "./components/common/Loader";
import { ChargePointStats } from "./components/charge-point/ChargePointStats";
import { EmptyStateChargePoints } from "./components/charge-point/EmptyStateChargePoints";
import { ChargePointsGrid } from "./components/charge-point/ChargePointsGrid";

export default function DashboardPage() {
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChargePoints = async () => {
    try {
      setError(null);
      const data = await api.getChargePoints();
      setChargePoints(data);
    } catch (err) {
      setError(
        "Impossible de charger les bornes. Vérifiez que le backend tourne sur http://localhost:3000",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChargePoints();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onRefreshClicked={loadChargePoints} />

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
