"use client";

import { Button } from "@watchborne/electrons";
import { ArrowRight, PlugZap, Server } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { OCPP_SERVER_URL } from "@/lib/constants";

import { CommissioningTokenPanel } from "./components/CommissioningTokenPanel";

export default function ConfigurationPage() {
  const t = useTranslations("");

  const stationIdPlaceholder = t("appPage.configuration.commissioningToken.exampleUrlPlaceholder");
  const commissioningTokenPlaceholder = t(
    "appPage.configuration.commissioningToken.commissioningTokenPlaceholder",
  );
  const exampleUrl = `${OCPP_SERVER_URL}/${stationIdPlaceholder}?token=${commissioningTokenPlaceholder}`;

  const connectionSteps = [
    t("appPage.configuration.connection.steps.openSettings"),
    t("appPage.configuration.connection.steps.enterAddress"),
    t.rich("appPage.configuration.connection.steps.appendId", {
      code: () => (
        <code className="block w-full rounded-md bg-muted px-3 py-2 font-mono text-sm break-all mt-1.5">
          {exampleUrl}
        </code>
      ),
    }),
    t("appPage.configuration.connection.steps.restart"),
  ];

  return (
    <div className="flex flex-col gap-6 content-stretch">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {t("appPage.configuration.page.title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t("appPage.configuration.page.subtitle")}
        </p>
      </div>

      <CommissioningTokenPanel />

      <section className="rounded-lg border">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Server className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{t("appPage.configuration.connection.title")}</span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            {t("appPage.configuration.connection.description")}
          </p>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              {t("appPage.configuration.connection.serverAddressLabel")}
            </p>
            <code className="block w-full rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
              {OCPP_SERVER_URL}
            </code>
          </div>

          <ol className="flex flex-col gap-2.5">
            {connectionSteps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charge-soft text-xs font-medium text-charge-strong">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-lg border">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <PlugZap className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">
            {t("appPage.configuration.association.title")}
          </span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            {t("appPage.configuration.association.description")}
          </p>
          <Button asChild variant="outline" className="w-full sm:w-fit">
            <Link href="/app/charge-points">
              {t("appPage.configuration.association.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
