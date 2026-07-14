import { Activity, AlertTriangle, Check, FileText, Hammer, Rocket, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const t = useTranslations("");

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

  const roadmap = Object.entries(t.raw("featuresPage.roadmap.items") as Record<string, string>);

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

      {/* ROADMAP */}
      <section className="container mx-auto px-6 pb-24">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-muted/30 p-10">
          <Badge className="mb-4">
            <Rocket className="mr-1 h-3 w-3" />
            {t("featuresPage.roadmap.badge")}
          </Badge>

          <h2 className="text-3xl font-bold">{t("featuresPage.roadmap.title")}</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {roadmap.map(([key, item]) => (
              <div key={key} className="flex items-start gap-3 rounded-xl border bg-background p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-primary px-8 py-16 text-primary-foreground">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold">{t("featuresPage.cta.title")}</h2>

            <p className="mt-4 text-lg opacity-90">{t("featuresPage.cta.subtitle")}</p>

            <Button size="lg" variant="charge" className="mt-8" asChild>
              <Link href="/signup">{t("featuresPage.cta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
