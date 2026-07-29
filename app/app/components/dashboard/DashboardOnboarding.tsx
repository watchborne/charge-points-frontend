import classNames from "classnames";
import { Check, MapPin, PlugZap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { Callout } from "../common/Callout";

type DashboardOnboardingProps = {
  /** Whether at least one site has already been created. */
  hasSites: boolean;
};

export const DashboardOnboarding = ({ hasSites }: DashboardOnboardingProps) => {
  const t = useTranslations("");

  const steps = [
    {
      key: "connect",
      icon: PlugZap,
      href: "/app/configuration",
      done: false,
    },
    {
      key: "sites",
      icon: MapPin,
      href: "/app/sites",
      done: hasSites,
    },
  ] as const;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b p-6 text-center">
        <h3 className="text-lg font-semibold">{t("appPage.dashboard.onboarding.title")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("appPage.dashboard.onboarding.description")}
        </p>
      </div>

      <ol className="divide-y">
        {steps.map((step, index) => (
          <li key={step.key} className="flex flex-wrap items-start gap-4 p-6 sm:flex-nowrap">
            <div
              className={classNames(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                step.done
                  ? "bg-status-available text-status-available-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {step.done ? <Check className="h-4 w-4" /> : index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                {t(`appPage.dashboard.onboarding.steps.${step.key}.title`)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t(`appPage.dashboard.onboarding.steps.${step.key}.description`)}
              </p>
              <Button asChild variant="link" className="px-0 h-auto mt-1">
                <Link href={step.href}>
                  {t(`appPage.dashboard.onboarding.steps.${step.key}.link`)}
                </Link>
              </Button>
            </div>
          </li>
        ))}

        <li className="p-6">
          <Callout
            variant="success"
            title={t("appPage.dashboard.onboarding.steps.success.title")}
            description={t("appPage.dashboard.onboarding.steps.success.description")}
          />
        </li>
      </ol>
    </div>
  );
};
