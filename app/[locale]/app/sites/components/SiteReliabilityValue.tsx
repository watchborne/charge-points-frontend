"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { SiteUptime } from "@/lib/api-uptime";

type SiteReliabilityValueProps = {
  siteId: string;
};

/**
 * Formats `onlineMs`/`totalMs` into a percentage string. `null` for a
 * zero-length window or a site with no charge points at all — division by
 * zero is not "0%", it's "no window was actually reduced"
 * (charge-points-server's `SiteUptime` leaves this undivided for exactly
 * this reason).
 */
const formatPercentage = (uptime: SiteUptime): string | null =>
  uptime.totalMs > 0 ? `${((uptime.onlineMs / uptime.totalMs) * 100).toFixed(1)}%` : null;

/**
 * A site's reliability over the last 7 days — summed across all its charge
 * points (the sum of their `onlineMs` over the sum of their `totalMs`, not
 * an average of their individual percentages; see
 * charge-points-server's `SiteUptime`), reduced server-side rather than
 * fetched per charge point. Just the value span: the surrounding label row
 * lives in `SiteDetailModal`, matching the other information rows there.
 *
 * Fetch-once and self-contained on mount — no dedicated WebSocket broadcast
 * exists for this, same as `ChargePointReliabilityTile`.
 */
export const SiteReliabilityValue = ({ siteId }: SiteReliabilityValueProps) => {
  const t = useTranslations("");

  const [uptime, setUptime] = useState<SiteUptime | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setUptime(null);
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const result = await api.Uptime.getSiteUptime(siteId);
        if (!cancelled) setUptime(result);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

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
