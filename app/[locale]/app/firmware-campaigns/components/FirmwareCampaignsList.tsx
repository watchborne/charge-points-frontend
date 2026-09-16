import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { useFormatter, useTranslations } from "next-intl";

import type { FirmwareCampaign } from "@/lib/api-firmware-campaigns";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { FirmwareCampaignStatusBadge } from "./FirmwareCampaignStatusBadge";

type FirmwareCampaignsListProps = {
  campaigns: FirmwareCampaign[];
  chargePoints: ChargePointWithConnectors[];
  onCampaignClicked: (campaign: FirmwareCampaign) => void;
};

/**
 * `targetChargePointIds.length` is already known from the list response for
 * `"LIST"` campaigns; `"SITE"`/`"FLEET"` don't carry a count of their own
 * (the backend only resolves the actual target set at dispatch time), so this
 * derives one client-side from charge points already fetched by
 * `useChargePoints` — avoiding an extra request per row for a number the
 * detail modal's `targetCount` (from `GET /api/firmware-campaigns/:id`)
 * already gives precisely once a campaign is opened.
 */
const targetCount = (
  campaign: FirmwareCampaign,
  chargePoints: ChargePointWithConnectors[],
): number => {
  switch (campaign.targetMode) {
    case "LIST":
      return campaign.targetChargePointIds.length;
    case "SITE":
      return chargePoints.filter((cp) => cp.siteId === campaign.targetSiteId).length;
    case "FLEET":
      return chargePoints.length;
    default:
      return 0;
  }
};

export const FirmwareCampaignsList = ({
  campaigns,
  chargePoints,
  onCampaignClicked,
}: FirmwareCampaignsListProps) => {
  const t = useTranslations("");
  const format = useFormatter();

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        {t("appPage.firmwareCampaigns.page.table.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("appPage.firmwareCampaigns.page.table.columns.name")}</TableHead>
            <TableHead>{t("appPage.firmwareCampaigns.page.table.columns.status")}</TableHead>
            <TableHead>{t("appPage.firmwareCampaigns.page.table.columns.targetMode")}</TableHead>
            <TableHead className="text-right">
              {t("appPage.firmwareCampaigns.page.table.columns.targetCount")}
            </TableHead>
            <TableHead>{t("appPage.firmwareCampaigns.page.table.columns.scheduledAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow
              key={campaign.id}
              className="cursor-pointer"
              onClick={() => onCampaignClicked(campaign)}
            >
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <FirmwareCampaignStatusBadge status={campaign.status} />
              </TableCell>
              <TableCell>
                {t(
                  `appPage.firmwareCampaigns.create.fields.targetModeOptions.${campaign.targetMode}`,
                )}
              </TableCell>
              <TableCell className="text-right">{targetCount(campaign, chargePoints)}</TableCell>
              <TableCell>
                {format.dateTime(new Date(campaign.scheduledAt), {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
