import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const t = useTranslations("");

  const plans = [
    {
      id: "small",
      name: t("pricingPage.plans.small.name"),
      description: t("pricingPage.plans.small.description"),
      sites: t("pricingPage.plans.small.sites"),
    },
    {
      id: "medium",
      name: t("pricingPage.plans.medium.name"),
      description: t("pricingPage.plans.medium.description"),
      sites: t("pricingPage.plans.medium.sites"),
      highlighted: true,
    },
    {
      id: "large",
      name: t("pricingPage.plans.large.name"),
      description: t("pricingPage.plans.large.description"),
      sites: t("pricingPage.plans.large.sites"),
    },
  ];

  const includedFeatures = [
    t("pricingPage.included.items.realtime"),
    t("pricingPage.included.items.offlineDetection"),
    t("pricingPage.included.items.multisite"),
    t("pricingPage.included.items.eventHistory"),
    t("pricingPage.included.items.alphaAccess"),
  ];

  const faqItems = [
    {
      question: t("pricingPage.faq.items.pricing.question"),
      answer: t("pricingPage.faq.items.pricing.answer"),
    },
    {
      question: t("pricingPage.faq.items.billing.question"),
      answer: t("pricingPage.faq.items.billing.answer"),
    },
    {
      question: t("pricingPage.faq.items.alpha.question"),
      answer: t("pricingPage.faq.items.alpha.answer"),
    },
  ];

  return (
    <main className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge>{t("pricingPage.badge")}</Badge>

        <h1 className="mt-6 text-5xl font-bold">
          {t("pricingPage.hero.title")}
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          {t("pricingPage.hero.subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl rounded-lg border bg-orange-50 p-6">
        <h3 className="mb-2 font-semibold text-orange-900">
          {t("pricingPage.alphaNotice.title")}
        </h3>
        <p className="text-sm text-orange-800">
          {t("pricingPage.alphaNotice.description")}
        </p>
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

            <p className="mt-2 text-sm text-muted-foreground">
              {plan.description}
            </p>

            <div className="mt-8">
              <p className="text-lg font-semibold">{plan.sites}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("pricingPage.included.title")}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {includedFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
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

        <p className="mt-4 text-lg text-muted-foreground">
          {t("pricingPage.cta.subtitle")}
        </p>

        <Button className="mt-8" size="lg">
          {t("pricingPage.cta.button")}
        </Button>
      </section>

      <section className="mx-auto mt-24 max-w-4xl">
        <h2 className="mb-10 text-center text-3xl font-bold">
          {t("pricingPage.faq.title")}
        </h2>

        <div className="space-y-8">
          {faqItems.map((item, index) => (
            <div key={index}>
              <h3 className="font-semibold">{item.question}</h3>

              <p className="mt-2 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
