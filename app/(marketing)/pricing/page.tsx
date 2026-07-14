import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const t = useTranslations("");

  const plans = [
    {
      id: "small",
      name: t("pricingPage.plans.small.name"),
      description: t("pricingPage.plans.small.description"),
      sites: t("pricingPage.plans.small.sites"),
      price: t("pricingPage.plans.small.price"),
      period: t("pricingPage.plans.small.period"),
    },
    {
      id: "medium",
      name: t("pricingPage.plans.medium.name"),
      description: t("pricingPage.plans.medium.description"),
      sites: t("pricingPage.plans.medium.sites"),
      price: t("pricingPage.plans.medium.price"),
      period: t("pricingPage.plans.medium.period"),
      highlighted: true,
    },
    {
      id: "large",
      name: t("pricingPage.plans.large.name"),
      description: t("pricingPage.plans.large.description"),
      sites: t("pricingPage.plans.large.sites"),
      price: t("pricingPage.plans.large.price"),
      period: t("pricingPage.plans.large.period"),
    },
  ];

  const includedFeatures = Object.entries(
    t.raw("pricingPage.included.items") as Record<string, string>,
  );

  const faqItems = Object.entries(
    t.raw("pricingPage.faq.items") as Record<string, { question: string; answer: string }>,
  );

  return (
    <main className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge>{t("pricingPage.badge")}</Badge>

        <h1 className="mt-6 break-words text-3xl font-bold sm:text-4xl md:text-5xl">
          {t("pricingPage.hero.title")}
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">{t("pricingPage.hero.subtitle")}</p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl rounded-lg border bg-orange-50 p-6">
        <h3 className="mb-2 font-semibold text-orange-900">{t("pricingPage.alphaNotice.title")}</h3>
        <p className="text-sm text-orange-800">{t("pricingPage.alphaNotice.description")}</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={
              plan.highlighted
                ? "rounded-lg border border-primary p-8 shadow-lg"
                : "rounded-lg border p-8"
            }
          >
            <h2 className="text-2xl font-bold">{plan.name}</h2>

            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

            <div className="mt-8 flex items-end gap-1">
              <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
              <span className="mb-1 text-sm text-muted-foreground">{plan.period}</span>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{plan.sites}</p>
          </div>
        ))}
      </div>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="mb-8 text-center text-2xl font-bold">{t("pricingPage.included.title")}</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {includedFeatures.map(([key, feature]) => (
            <div key={key} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-4xl rounded-lg border bg-muted/50 p-8">
        <h2 className="mb-4 text-center text-2xl font-bold">
          {t("pricingPage.futurePricing.title")}
        </h2>

        <p className="mb-6 text-center text-muted-foreground">
          {t("pricingPage.futurePricing.description")}
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Check className="mt-1 h-4 w-4 text-primary" />
            <span>{t("pricingPage.futurePricing.sites")}</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="mt-1 h-4 w-4 text-primary" />
            <span>{t("pricingPage.futurePricing.includedChargePoints")}</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="mt-1 h-4 w-4 text-primary" />
            <span>{t("pricingPage.futurePricing.extraChargePoint")}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("pricingPage.alphaNotice.launchAdvantage")}
        </p>
      </section>

      <section className="mx-auto mt-24 max-w-4xl text-center">
        <h2 className="text-3xl font-bold">{t("pricingPage.cta.title")}</h2>

        <p className="mt-4 text-lg text-muted-foreground">{t("pricingPage.cta.subtitle")}</p>

        <Button className="mt-8" size="lg">
          {t("pricingPage.cta.button")}
        </Button>
      </section>

      <section className="mx-auto mt-24 max-w-4xl">
        <h2 className="mb-10 text-center text-3xl font-bold">{t("pricingPage.faq.title")}</h2>

        <div className="space-y-8">
          {faqItems.map(([key, item]) => (
            <div key={key}>
              <h3 className="font-semibold">{item.question}</h3>

              <p className="mt-2 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
