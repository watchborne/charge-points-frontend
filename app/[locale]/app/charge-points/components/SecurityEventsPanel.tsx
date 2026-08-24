"use client";

import { Callout } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { Clock, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { SecurityEvent } from "@/lib/api-security-events";
import type { ChargePoint } from "@/types/charge-point";

type SecurityEventsPanelProps = {
  chargePointId: ChargePoint["id"];
};

/** How many recent reports the panel shows — a glance at recent activity,
 * not a full audit log (the endpoint supports a much longer history if a
 * fuller browser is ever built), the same cap `AlertsPanel` uses. */
const VISIBLE_EVENT_COUNT = 5;

/**
 * The station's own event-type string (OCPP Security Whitepaper / 2.0.1
 * §3.4) is an open vocabulary — "TamperDetectionActivated" — so it can't be
 * translated through i18n keys the way `Alert.type` is. This only spaces out
 * the PascalCase for readability; it does not attempt to interpret the value.
 */
const humanizeEventType = (type: string): string =>
  type.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

/**
 * A charge point's `SecurityEventNotification` history (charge-points-server
 * ADR 0009): tamper attempts, unexpected reboots, firmware changes, failed
 * authentication — reported verbatim, not interpreted. Fetch-once and
 * self-contained, the same shape as `AlertsPanel`: there is no dedicated
 * WebSocket broadcast for these yet, so this does not subscribe to the
 * dashboard socket.
 */
export const SecurityEventsPanel = ({ chargePointId }: SecurityEventsPanelProps) => {
  const t = useTranslations("");

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Reset before refetching so a different station's events are never shown
    // under this one while the request is in flight.
    setEvents([]);
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const result = await api.SecurityEvents.list(chargePointId, VISIBLE_EVENT_COUNT);
        if (!cancelled) setEvents(result);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chargePointId]);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold">{t("appPage.chargePoints.securityEvents.title")}</h4>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.securityEvents.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.securityEvents.loadError")} variant="error" />
      )}

      {!loading && !failed && events.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.securityEvents.empty")}
        </span>
      )}

      {!loading && !failed && events.length > 0 && (
        <div className="divide-y rounded-md border">
          {events.map((event) => (
            <div key={event.id} className="flex flex-col gap-1.5 px-3 py-2">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
                {humanizeEventType(event.type)}
              </span>

              {event.techInfo && (
                <span className="text-xs text-muted-foreground">{event.techInfo}</span>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {formatDistanceToNow(new Date(event.occurredAt), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
                <span>({format(new Date(event.occurredAt), "dd/MM/yyyy HH:mm")})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
