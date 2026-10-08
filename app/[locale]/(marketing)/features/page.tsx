import { Badge, Button } from "@watchborne/electrons";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Hammer,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/locale";
import { Link } from "@/i18n/navigation";

import { ChargePointPreviewTabs } from "../components/ChargePointPreviewTabs";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  // Required in this page too, not just the layout — see app/[locale]/(marketing)/page.tsx.
  setRequestLocale(locale as Locale);

  // getTranslations, not useTranslations: see app/[locale]/(marketing)/page.tsx.
  const t = await getTranslations("");

  const workflow = [
    {
      icon: Wrench,
      title: t("featuresPage.workflow.items.installation.title"),
      description: t("featuresPage.workflow.items.installation.description"),
    },
    {
      icon: Activity,
      title: t("featuresPage.workflow.items.monitoring.title"),
      description: t("featuresPage.workflow.items.monitoring.description"),
    },
    {
      icon: AlertTriangle,
      title: t("featuresPage.workflow.items.maintenance.title"),
      description: t("featuresPage.workflow.items.maintenance.description"),
    },
    {
      icon: FileText,
      title: t("featuresPage.workflow.items.reporting.title"),
      description: t("featuresPage.workflow.items.reporting.description"),
    },
  ];

  const catalog = [
    { key: "supervision", icon: Activity },
    { key: "commissioning", icon: Wrench },
    { key: "maintenance", icon: AlertTriangle },
    { key: "reporting", icon: FileText },
    { key: "security", icon: ShieldCheck },
  ].map(({ key, icon }) => ({
    key,
    icon,
    title: t(`featuresPage.catalog.groups.${key}.title`),
    items: Object.entries(
      t.raw(`featuresPage.catalog.groups.${key}.items`) as Record<
        string,
        { title: string; description: string }
      >,
    ),
  }));

  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary">{t("featuresPage.badge")}</Badge>

          <h1 className="mt-6 break-words text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("featuresPage.hero.title")}
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">{t("featuresPage.hero.subtitle")}</p>
        </div>
      </section>

      {/* INTRO */}
      <section className="container mx-auto px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-lg border bg-muted/30 p-8 text-center">
          <h2 className="text-2xl font-bold">{t("featuresPage.intro.title")}</h2>

          <p className="mt-4 text-muted-foreground">{t("featuresPage.intro.description")}</p>
        </div>
      </section>

      <hr />

      {/* WORKFLOW */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">{t("featuresPage.workflow.title")}</h2>

          <p className="mt-4 text-muted-foreground">{t("featuresPage.workflow.subtitle")}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          {workflow.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="rounded-lg border p-6">
                <Icon className="mb-4 h-6 w-6 text-charge-strong" />

                <h3 className="mb-2 font-semibold">{step.title}</h3>

                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <hr />

      {/* CATALOG */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">{t("featuresPage.catalog.title")}</h2>

          <p className="mt-4 text-muted-foreground">{t("featuresPage.catalog.subtitle")}</p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl space-y-16">
          {catalog.map((group) => {
            const Icon = group.icon;

            return (
              <div key={group.key}>
                <div className="mb-6 flex items-center gap-3">
                  <Icon className="h-6 w-6 text-charge-strong" />

                  <h3 className="text-2xl font-semibold">{group.title}</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map(([key, item]) => (
                    <div key={key} className="flex items-start gap-3 rounded-lg border p-5">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-charge-strong" />

                      <div>
                        <h4 className="font-medium">{item.title}</h4>

                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <hr />

      {/* PRODUCT PREVIEW */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            {t("productPreview.badge")}
          </Badge>

          <h2 className="text-4xl font-bold tracking-tight">{t("productPreview.title")}</h2>

          <p className="mt-4 text-muted-foreground">{t("productPreview.subtitle")}</p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <ChargePointPreviewTabs />
        </div>
      </section>

      <hr />

      {/* CONSTRUCTION NOTICE */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-lg border border-charge/20 bg-charge-soft p-6 text-center">
          <Hammer className="mx-auto mb-3 h-6 w-6 text-charge-strong" />

          <h3 className="mb-2 font-semibold text-charge-strong">
            {t("featuresPage.constructionNotice.title")}
          </h3>

          <p className="text-sm text-charge-strong/90">
            {t("featuresPage.constructionNotice.description")}
          </p>
        </div>
      </section>

      {/* ROADMAP LINK */}
      <section className="container mx-auto px-6 pb-24">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-muted/30 p-10 text-center">
          <h2 className="text-3xl font-bold">{t("featuresPage.roadmapLink.title")}</h2>

          <p className="mt-4 text-muted-foreground">{t("featuresPage.roadmapLink.description")}</p>

          <Button variant="outline" className="mt-6" asChild>
            <Link href="/features/roadmap">
              {t("featuresPage.roadmapLink.button")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-muted px-8 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-primary">{t("featuresPage.cta.title")}</h2>

            <p className="mt-4 text-lg opacity-90 text-primary">{t("featuresPage.cta.subtitle")}</p>

            <Button size="lg" variant="charge" className="mt-8" asChild>
              <Link href="/signup">{t("featuresPage.cta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
