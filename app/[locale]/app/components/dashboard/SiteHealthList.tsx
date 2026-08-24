import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { SiteHealthBadge } from "./SiteHealthBadge";
import { SiteWithHealth } from "./SiteHealthSection";

/** Every visible site, one row each: status badge plus the
 * online/warning/offline breakdown behind it. */
export const SiteHealthList = ({ sitesWithHealth }: { sitesWithHealth: SiteWithHealth[] }) => {
  const t = useTranslations("");
  const router = useRouter();

  const onRowClicked = (siteId: string): void => {
    router.push(`/app/sites?id=${siteId}`);
  };

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
            <TableHead className="text-right hidden sm:visible">
              {t("appPage.dashboard.siteHealth.list.columns.online")}
            </TableHead>
            <TableHead className="text-right hidden sm:visible">
              {t("appPage.dashboard.siteHealth.list.columns.warning")}
            </TableHead>
            <TableHead className="text-right hidden sm:visible">
              {t("appPage.dashboard.siteHealth.list.columns.offline")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sitesWithHealth.map(({ site, health }) => (
            <TableRow key={site.id} onClick={() => onRowClicked(site.id)}>
              <TableCell className="font-medium">{site.name}</TableCell>
              <TableCell>
                <SiteHealthBadge status={health.status} />
              </TableCell>
              <TableCell className="text-right hidden sm:visible">
                {health.chargePointsOnline}
              </TableCell>
              <TableCell className="text-right hidden sm:visible">
                {health.chargePointsWarning}
              </TableCell>
              <TableCell className="text-right hidden sm:visible">
                {health.chargePointsOffline}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
