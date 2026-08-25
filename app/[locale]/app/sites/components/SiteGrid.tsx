import { Site } from "@watchborne/charge-points-types";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { SiteCard } from "./SiteCard";

type SiteGridProps = {
  sites: Site[];
  chargePoints: ChargePointWithConnectors[];
  onSiteClicked: (site: Site) => void;
};

export const SiteGrid = ({ sites, chargePoints, onSiteClicked }: SiteGridProps) => {
  const t = useTranslations("");

  if (sites.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        {t("appPage.sites.page.table.empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
      {sites.map((site) => (
        <SiteCard
          key={site.id}
          site={site}
          chargePoints={chargePoints.filter((cp) => cp.siteId === site.id)}
          onSiteClicked={onSiteClicked}
        />
      ))}
    </div>
  );
};
