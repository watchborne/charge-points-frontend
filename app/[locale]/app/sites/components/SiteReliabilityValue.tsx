"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import type { SiteUptime } from "@/lib/api-uptime";
import { queryKeys } from "@/lib/queryKeys";

type SiteReliabilityValueProps = {
  siteId: string;
};

/**
 * `onlineMs`/`totalMs` as a percentage; `null` for a zero-length window or a
 * site without charge points.
 */
const formatPercentage = (uptime: SiteUptime): string | null =>
  uptime.totalMs > 0 ? `${((uptime.onlineMs / uptime.totalMs) * 100).toFixed(1)}%` : null;

/**
 * A site's reliability over the last 7 days: summed `onlineMs` over summed
 * `totalMs` across its charge points (not an average of percentages),
 * reduced server-side. Only the value; the label row is in `SiteDetail`.
 * Fetch-once.
 */
export const SiteReliabilityValue = ({ siteId }: SiteReliabilityValueProps) => {
  const t = useTranslations("");

  const {
    data: uptime,
    isLoading: loading,
    isError: failed,
  } = useQuery({
    queryKey: queryKeys.uptime.site(siteId),
    queryFn: () => api.Uptime.getSiteUptime(siteId),
  });

  const percentage = uptime ? formatPercentage(uptime) : null;

  return (
    <span className="font-medium">
      {loading
        ? "—"
        : failed
          ? t("common.error")
          : (percentage ?? t("appPage.sites.detail.reliability.noData"))}
    </span>
  );
};
