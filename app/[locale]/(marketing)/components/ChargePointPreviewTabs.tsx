"use client";

import { Tabs, TabsList, TabsTrigger } from "@watchborne/electrons";
import { AlertTriangle, BarChart3, Battery, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type PreviewTab = "main" | "consumption" | "sessions" | "alerts" | "security";

const PREVIEW_TABS: readonly PreviewTab[] = [
  "main",
  "consumption",
  "sessions",
  "alerts",
  "security",
];

const CONSUMPTION_BAR_HEIGHTS = [28, 44, 34, 52, 40, 60, 46];

/**
 * Static, illustrative mockup of `ChargePointDetailPanel`'s tabs, reused on
 * the homepage and the features page. Deliberately not wired to the real
 * dashboard data or API — marketing pages are unauthenticated and statically
 * rendered — so every value here is a hardcoded example, not live data.
 */
export const ChargePointPreviewTabs = () => {
  const t = useTranslations("");
  const [tab, setTab] = useState<PreviewTab>("main");

  return (
    <div className="rounded-3xl border bg-muted/30 p-6 md:p-10">
      <Tabs value={tab} onValueChange={(value) => setTab(value as PreviewTab)}>
        <TabsList>
          {PREVIEW_TABS.map((option) => (
            <TabsTrigger key={option} value={option}>
              {t(`appPage.chargePoints.detail.tabs.${option}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6 rounded-2xl border bg-background p-6">
        {tab === "main" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Battery className="h-4 w-4" />
              {t("productPreview.main.connectorsTitle")}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">{t("productPreview.main.connector1")}</span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-charging" />
                  {t("homePage.dashboard.status.charging")}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">{t("productPreview.main.connector2")}</span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-available" />
                  {t("homePage.dashboard.status.available")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-muted-foreground">{t("productPreview.main.lastSeen")}</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {t("productPreview.main.lastSeenValue")}
              </span>
            </div>
          </div>
        )}

        {tab === "consumption" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              {t("productPreview.consumption.label")}
            </div>

            <div className="text-3xl font-bold text-charge-strong">
              {t("productPreview.consumption.total")}
            </div>

            <div className="flex items-end gap-1.5" aria-hidden="true">
              {CONSUMPTION_BAR_HEIGHTS.map((height, index) => (
                <div
                  key={index}
                  className="w-6 rounded-t bg-charge-soft"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              {t("productPreview.consumption.caption")}
            </p>
          </div>
        )}

        {tab === "sessions" && (
          <div className="space-y-3">
            {(["session1", "session2", "session3"] as const).map((key) => (
              <div key={key} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium">{t(`productPreview.sessions.${key}`)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "alerts" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning-foreground" />
              <div>
                <p className="text-sm font-medium">{t("productPreview.alerts.alert1")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("productPreview.alerts.alert1Meta")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-status-available/20 bg-status-available-soft p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-available-foreground" />
              <div>
                <p className="text-sm font-medium">{t("productPreview.alerts.alert2")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("productPreview.alerts.alert2Meta")}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-3">
            {(["event1", "event2"] as const).map((key) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">{t(`productPreview.security.${key}`)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
