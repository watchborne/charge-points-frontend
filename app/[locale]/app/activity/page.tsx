"use client";

import { Button, Input } from "@watchborne/electrons";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  AUDIT_ACTIONS,
  AuditAction,
  AUDIT_OUTCOMES,
  AuditOutcome,
  AuditEntry,
  ListAuditEntriesFilters,
} from "@/lib/api-audit";

import { AuditTrailList } from "../components/common/AuditTrailList";
import { useAuditTrail } from "../hooks/useAuditTrail";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";

type Period = "all" | "24h" | "7d" | "30d";

const PERIODS: readonly Period[] = ["all", "24h", "7d", "30d"];

const PERIOD_LABEL_KEY: Record<Period, string> = {
  all: "appPage.activity.page.filters.periodOptions.all",
  "24h": "appPage.activity.page.filters.periodOptions.last24h",
  "7d": "appPage.activity.page.filters.periodOptions.last7d",
  "30d": "appPage.activity.page.filters.periodOptions.last30d",
};

const OUTCOME_LABEL_KEY: Record<AuditOutcome, string> = {
  PENDING: "appPage.activity.outcomes.pending",
  SUCCEEDED: "appPage.activity.outcomes.succeeded",
  REJECTED: "appPage.activity.outcomes.rejected",
  FAILED: "appPage.activity.outcomes.failed",
  TIMED_OUT: "appPage.activity.outcomes.timedOut",
};

const periodToFrom = (period: Period): Date | undefined => {
  if (period === "all") return undefined;
  const days = period === "24h" ? 1 : period === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

export default function ActivityPage() {
  const t = useTranslations("");
  const { chargePoints } = useChargePoints();
  const { sites } = useSites();

  const [period, setPeriod] = useState<Period>("all");
  const [action, setAction] = useState<AuditAction | "all">("all");
  const [outcome, setOutcome] = useState<AuditOutcome | "all">("all");
  const [siteId, setSiteId] = useState<string>("all");
  const [actorUserId, setActorUserId] = useState("");
  const [customerId, setCustomerId] = useState("");

  const chargePointNameById = useMemo(
    () => new Map(chargePoints.map((cp) => [cp.id, cp.name])),
    [chargePoints],
  );
  const siteNameById = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);

  const getTargetLabel = (entry: AuditEntry): string | undefined => {
    const { chargePointId, siteId: targetSiteId, customerId: targetCustomerId } = entry.target;
    if (chargePointId) return chargePointNameById.get(chargePointId) ?? chargePointId;
    if (targetSiteId) return siteNameById.get(targetSiteId) ?? targetSiteId;
    if (targetCustomerId) return targetCustomerId;
    return undefined;
  };

  const filters: ListAuditEntriesFilters = {
    from: periodToFrom(period),
    action: action === "all" ? undefined : action,
    outcome: outcome === "all" ? undefined : outcome,
    siteId: siteId === "all" ? undefined : siteId,
    actorUserId: actorUserId.trim() || undefined,
    customerId: customerId.trim() || undefined,
  };

  const { entries, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAuditTrail({ filters });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{t("appPage.activity.page.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("appPage.activity.page.subtitle")}</p>
          </div>

          <a href={api.Audit.csvExportUrl(filters)} download>
            <Button variant="outline">{t("appPage.activity.page.exportCsv")}</Button>
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger
              className="h-9 min-w-[150px] w-max text-sm"
              aria-label={t("appPage.activity.page.filters.period")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(PERIOD_LABEL_KEY[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={(value) => setAction(value as AuditAction | "all")}>
            <SelectTrigger
              className="h-9 min-w-[180px] w-max text-sm"
              aria-label={t("appPage.activity.page.filters.action")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("appPage.activity.page.filters.allActions")}</SelectItem>
              {AUDIT_ACTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`appPage.activity.actions.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={outcome}
            onValueChange={(value) => setOutcome(value as AuditOutcome | "all")}
          >
            <SelectTrigger
              className="h-9 min-w-[150px] w-max text-sm"
              aria-label={t("appPage.activity.page.filters.outcome")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("appPage.activity.page.filters.allOutcomes")}</SelectItem>
              {AUDIT_OUTCOMES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(OUTCOME_LABEL_KEY[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger
              className="h-9 min-w-[150px] w-max text-sm"
              aria-label={t("appPage.activity.page.filters.site")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("appPage.activity.page.filters.allSites")}</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="h-9 min-w-[150px] w-max text-sm"
            placeholder={t("appPage.activity.page.filters.userPlaceholder")}
            aria-label={t("appPage.activity.page.filters.user")}
            value={actorUserId}
            onChange={(e) => setActorUserId(e.target.value)}
          />

          <Input
            className="h-9 min-w-[150px] w-max text-sm"
            placeholder={t("appPage.activity.page.filters.customerPlaceholder")}
            aria-label={t("appPage.activity.page.filters.customer")}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
        </div>
      </div>

      <AuditTrailList
        entries={entries}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        emptyMessageKey="appPage.activity.empty"
        getTargetLabel={getTargetLabel}
      />
    </div>
  );
}
