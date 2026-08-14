import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { useTranslations } from "next-intl";

import { SiteHealthBadge } from "./SiteHealthBadge";
import { SiteWithHealth } from "./SiteHealthSection";

/** Every visible site, one row each: status badge plus the
 * online/warning/offline breakdown behind it. */
export const SiteHealthList = ({ sitesWithHealth }: { sitesWithHealth: SiteWithHealth[] }) => {
  const t = useTranslations("");

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {t("appPage.dashboard.siteHealth.list.title")}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("appPage.dashboard.siteHealth.list.columns.site")}</TableHead>
            <TableHead>{t("appPage.dashboard.siteHealth.list.columns.status")}</TableHead>
            <TableHead className="text-right">
              {t("appPage.dashboard.siteHealth.list.columns.online")}
            </TableHead>
            <TableHead className="text-right">
              {t("appPage.dashboard.siteHealth.list.columns.warning")}
            </TableHead>
            <TableHead className="text-right">
              {t("appPage.dashboard.siteHealth.list.columns.offline")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sitesWithHealth.map(({ site, health }) => (
            <TableRow key={site.id}>
              <TableCell className="font-medium">{site.name}</TableCell>
              <TableCell>
                <SiteHealthBadge status={health.status} />
              </TableCell>
              <TableCell className="text-right">{health.chargePointsOnline}</TableCell>
              <TableCell className="text-right">{health.chargePointsWarning}</TableCell>
              <TableCell className="text-right">{health.chargePointsOffline}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
