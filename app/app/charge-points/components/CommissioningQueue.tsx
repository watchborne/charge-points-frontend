import { ArrowRight, PlugZap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatusBadge } from "../../components/charge-points/StatusBadge";

type CommissioningQueueProps = {
  /** Unassigned (discovered) charge points awaiting commissioning. */
  chargePoints: ChargePointWithConnectors[];
  onCommission: (chargePoint: ChargePointWithConnectors) => void;
};

/**
 * Surfaces charge points that have connected (auto-discovered) but are not yet
 * attached to a site, so an installer sees the commissioning backlog up front
 * instead of hunting for them in the "unknown site" group. Renders nothing when
 * the queue is empty.
 */
export const CommissioningQueue = ({ chargePoints, onCommission }: CommissioningQueueProps) => {
  const t = useTranslations("");

  if (chargePoints.length === 0) return null;

  return (
    <section className="rounded-xl border border-charge-strong/20 bg-charge-soft/40 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-charge-strong/10 px-4 py-3 sm:px-6">
        <PlugZap className="h-4 w-4 shrink-0 text-charge-strong" />
        <h3 className="text-sm font-semibold">{t("appPage.chargePoints.commissioning.title")}</h3>
        <Badge variant="secondary">{chargePoints.length}</Badge>
        <p className="w-full text-sm text-muted-foreground sm:ml-1 sm:w-auto">
          {t("appPage.chargePoints.commissioning.description")}
        </p>
      </div>

      <ul className="divide-y">
        {chargePoints.map((cp) => (
          <li
            key={cp.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-medium">{cp.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={cp.connection.status} />
                <span className="text-xs text-muted-foreground">
                  {t("appPage.chargePoints.commissioning.connectorsWithCount", {
                    count: cp.connectors.length,
                  })}
                </span>
              </div>
            </div>
            <Button size="sm" onClick={() => onCommission(cp)}>
              {t("appPage.chargePoints.commissioning.cta")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};
