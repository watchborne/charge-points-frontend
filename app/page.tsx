'use client';

import { useEffect, useState } from 'react';
import { ChargePoint } from '@/types';
import { api } from '@/lib/api';
import { ChargePointCard } from '@/components/ChargePointCard';
import { Battery, RefreshCw, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function DashboardPage() {
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Charger les bornes
  const loadChargePoints = async () => {
    try {
      setError(null);
      const data = await api.getChargePoints();
      setChargePoints(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Impossible de charger les bornes. Vérifiez que le backend tourne sur http://localhost:3000');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadChargePoints();
  }, []);

  // Auto-refresh toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadChargePoints();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculer les stats
  const stats = {
    total: chargePoints.length,
    online: chargePoints.filter(cp => cp.lifecycle === 'SYNCED').length,
    available: chargePoints.filter(cp => cp.status === 'Available' && cp.lifecycle === 'SYNCED').length,
    charging: chargePoints.filter(cp => cp.status === 'Charging').length,
    faulted: chargePoints.filter(cp => cp.status === 'Faulted' || cp.lifecycle === 'OFFLINE').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Supervision Bornes de Recharge</h1>
            </div>
            <button
              onClick={loadChargePoints}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-2">
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
              <span className="ml-2 text-xs">(rafraîchissement automatique toutes les 5s)</span>
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
            <p className="text-sm text-red-600 mt-2">
              Lancez le backend avec : <code className="bg-red-100 px-2 py-1 rounded">cd backend && npm run dev</code>
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Chargement des bornes...</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <StatCard
                title="Total Bornes"
                value={stats.total}
                icon={<Battery className="h-5 w-5 text-gray-600" />}
              />
              <StatCard
                title="En Ligne"
                value={stats.online}
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                subtitle={`${stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%`}
              />
              <StatCard
                title="Disponibles"
                value={stats.available}
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              />
              <StatCard
                title="En Charge"
                value={stats.charging}
                icon={<Loader className="h-5 w-5 text-blue-600" />}
              />
              <StatCard
                title="En Panne"
                value={stats.faulted}
                icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              />
            </div>

            {/* Charge Points Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Bornes ({chargePoints.length})</h2>
              {chargePoints.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Battery className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Aucune borne détectée</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les bornes apparaîtront ici une fois connectées au serveur OCPP
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    💡 Lancez le simulateur : <code className="bg-gray-100 px-2 py-1 rounded">cd simulator && npm run simulate</code>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chargePoints.map((chargePoint) => (
                    <ChargePointCard key={chargePoint.id} chargePoint={chargePoint} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Composant StatCard
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
