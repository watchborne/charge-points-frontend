import { GenericStatusBadge } from "@/app/[locale]/app/components/common/GenericStatusBadge";
import type { FirmwareCampaignStatus } from "@/lib/api-firmware-campaigns";
import { firmwareCampaignStatusColor } from "@/lib/status";

const STATUS_LABEL_KEY: Record<FirmwareCampaignStatus, string> = {
  SCHEDULED: "appPage.firmwareCampaigns.status.scheduled",
  DISPATCHING: "appPage.firmwareCampaigns.status.dispatching",
  DISPATCHED: "appPage.firmwareCampaigns.status.dispatched",
  CANCELLED: "appPage.firmwareCampaigns.status.cancelled",
};

export const FirmwareCampaignStatusBadge = ({ status }: { status: FirmwareCampaignStatus }) => (
  <GenericStatusBadge
    status={status}
    getTone={firmwareCampaignStatusColor}
    getLabelKey={(s) => STATUS_LABEL_KEY[s]}
  />
);
