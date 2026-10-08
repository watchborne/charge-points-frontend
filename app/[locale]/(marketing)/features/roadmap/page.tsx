import { Badge, Button } from "@watchborne/electrons";
import cn from "classnames";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/locale";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

type Phase = {
  title: string;
  description: string;
  items: Record<string, string>;
};

const UPCOMING_PHASE = "upcoming";

export default async function RoadmapPage({ params }: Props) {
  const { locale } = await params;
  // Required in this page too, not just the layout — see app/[locale]/(marketing)/page.tsx.
  setRequestLocale(locale as Locale);

  // getTranslations, not useTranslations: see app/[locale]/(marketing)/page.tsx.
  const t = await getTranslations("");

  // Phases are listed in delivery order, the upcoming one last.
  const phases = Object.entries(t.raw("roadmapPage.phases") as Record<string, Phase>);

  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section className="container mx-auto px-6 pb-12 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary">{t("roadmapPage.badge")}</Badge>

          <h1 className="mt-6 break-words text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("roadmapPage.hero.title")}
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">{t("roadmapPage.hero.subtitle")}</p>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="container mx-auto px-6 pb-24">
        <ol className="mx-auto max-w-3xl border-l-2 border-border">
          {phases.map(([key, phase]) => {
            const upcoming = key === UPCOMING_PHASE;
            const Icon = upcoming ? Clock3 : Check;

            return (
              <li key={key} className="relative pb-12 pl-10 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                    upcoming
                      ? "border-dashed border-muted-foreground text-muted-foreground"
                      : "border-charge-strong text-charge-strong",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{phase.title}</h2>

                  <Badge variant={upcoming ? "secondary" : "default"}>
                    {t(upcoming ? "roadmapPage.status.upcoming" : "roadmapPage.status.delivered")}
                  </Badge>
                </div>

                <p className="mt-2 text-muted-foreground">{phase.description}</p>

                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(phase.items).map(([itemKey, item]) => (
                    <li
                      key={itemKey}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-sm",
                        upcoming && "border-dashed bg-muted/30",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          upcoming ? "text-muted-foreground" : "text-charge-strong",
                        )}
                      />

                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>

        <div className="mx-auto mt-12 max-w-3xl">
          <Button variant="ghost" asChild>
            <Link href="/features">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("roadmapPage.back")}
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-muted px-8 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-primary">{t("roadmapPage.cta.title")}</h2>

            <p className="mt-4 text-lg opacity-90 text-primary">{t("roadmapPage.cta.subtitle")}</p>

            <Button size="lg" variant="charge" className="mt-8" asChild>
              <Link href="/signup">{t("roadmapPage.cta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
