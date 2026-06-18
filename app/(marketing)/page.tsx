import { useTranslations } from "next-intl";

export default function MarketingHomePage() {
  const t = useTranslations("");

  return (
    <div className="min-h-screen bg-gray-50">
      <h1>Marketing website</h1>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {t("appName")} Homepage
      </main>
    </div>
  );
}