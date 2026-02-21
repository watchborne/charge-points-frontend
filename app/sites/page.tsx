"use client";

import { useSites } from "../hooks/useSites";

import { Header } from "../components/layout/Header";
import { ErrorCallout } from "../components/common/ErrorCallout";
import { Loader } from "../components/common/Loader";

export default function SitesPage() {
  const { sites, loading, error } = useSites();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorCallout error={error} />}

        {loading && <Loader label="Loading sites..." />}

        {!loading && !error && <pre>{JSON.stringify(sites, null, 2)}</pre>}
      </main>
    </div>
  );
}
