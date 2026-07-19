import {
  ArrowRight,
  Activity,
  Building2,
  PlugZap,
  ShieldCheck,
  Clock3,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("");

  const features = [
    {
      icon: Activity,
      title: t("homePage.features.realtime.title"),
      description: t("homePage.features.realtime.description"),
    },
    {
      icon: Building2,
      title: t("homePage.features.multisite.title"),
      description: t("homePage.features.multisite.description"),
    },
    {
      icon: PlugZap,
      title: t("homePage.features.ocpp.title"),
      description: t("homePage.features.ocpp.description"),
    },
    {
      icon: Clock3,
      title: t("homePage.features.offline.title"),
      description: t("homePage.features.offline.description"),
    },
    {
      icon: MapPin,
      title: t("homePage.features.fleet.title"),
      description: t("homePage.features.fleet.description"),
    },
    {
      icon: ShieldCheck,
      title: t("homePage.features.reliable.title"),
      description: t("homePage.features.reliable.description"),
    },
  ];

  const roadmap = Object.entries(t.raw("homePage.roadmap.items") as Record<string, string>);
  const mvpFeatures = Object.entries(t.raw("homePage.mvpFeatures.items") as Record<string, string>);

  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-6">
              {t("homePage.hero.badge")}
            </Badge>

            <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              {t("homePage.hero.title")}
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t("homePage.hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" variant="charge">
                {t("homePage.hero.cta.primary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">{t("homePage.hero.cta.secondary")}</Link>
              </Button>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="mt-20">
            <div className="border shadow-2xl">
              <div className="p-0">
                <div className="grid md:grid-cols-3">
                  {/* Sidebar */}
                  <div className="border-r bg-muted/30 p-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      {t("homePage.dashboard.sites")}
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-lg border bg-background p-4">
                        <div className="font-medium">Paris HQ</div>
                        <div className="mt-2 text-sm text-status-available-foreground">
                          14 {t("homePage.dashboard.status.online")}
                        </div>
                      </div>

                      <div className="rounded-lg border bg-background p-4">
                        <div className="font-medium">Lyon</div>
                        <div className="mt-2 text-sm text-status-warning-foreground">
                          1 {t("homePage.dashboard.status.offline")}
                        </div>
                      </div>

                      <div className="rounded-lg border bg-background p-4">
                        <div className="font-medium">Marseille</div>
                        <div className="mt-2 text-sm text-status-available-foreground">
                          8 {t("homePage.dashboard.status.online")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="col-span-2 p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {t("homePage.dashboard.fleetOverview")}
                      </h3>

                      <Badge>{t("homePage.dashboard.live")}</Badge>
                    </div>

                    <div className="space-y-4">
                      {[
                        {
                          id: "CP-001",
                          status: t("homePage.dashboard.status.available"),
                          color: "bg-status-available",
                        },
                        {
                          id: "CP-002",
                          status: t("homePage.dashboard.status.charging"),
                          color: "bg-status-charging",
                        },
                        {
                          id: "CP-003",
                          status: t("homePage.dashboard.status.faulted"),
                          color: "bg-status-error",
                        },
                        {
                          id: "CP-004",
                          status: t("homePage.dashboard.status.offline"),
                          color: "bg-status-offline",
                        },
                      ].map((cp) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="font-medium">{cp.id}</div>

                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${cp.color}`} />
                            <span className="text-sm">{cp.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* FEATURES */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            {t("homePage.featuresSection.title")}
          </h2>

          <p className="mt-4 text-muted-foreground">{t("homePage.featuresSection.subtitle")}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title}>
                <div className="p-6">
                  <Icon className="mb-4 h-6 w-6 text-charge-strong" />

                  <h3 className="mb-2 font-semibold">{feature.title}</h3>

                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <hr />

      {/* MVP FEATURES */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold">{t("homePage.mvpFeatures.title")}</h2>

          <p className="mt-4 text-muted-foreground">{t("homePage.mvpFeatures.subtitle")}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
          {mvpFeatures.map(([key, item]) => (
            <div key={key}>
              <div className="flex items-center gap-3 p-5">
                <ShieldCheck className="h-5 w-5 text-charge-strong" />
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr />

      {/* ROADMAP */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-muted/30 p-10">
          <Badge className="mb-4">{t("homePage.roadmap.badge")}</Badge>

          <h2 className="text-3xl font-bold">{t("homePage.roadmap.title")}</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {roadmap.map(([key, item]) => (
              <div key={key} className="rounded-xl border bg-background p-4">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-primary px-8 py-16 text-primary-foreground">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold">{t("homePage.cta.title")}</h2>

            <p className="mt-4 text-lg opacity-90">{t("homePage.cta.subtitle")}</p>

            <Button size="lg" variant="charge" className="mt-8">
              {t("homePage.cta.button")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
