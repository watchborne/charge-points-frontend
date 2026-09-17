import { accessRequestApis } from "./api-access-requests";
import { chargePointApis } from "./api-charge-points";
import { commissioningTokenApis } from "./api-commissioning-token";
import { deviceEventApis } from "./api-device-events";
import { deviceVariableReportApis } from "./api-device-variable-reports";
import { displayMessageApis } from "./api-display-messages";
import { firmwareCampaignApis } from "./api-firmware-campaigns";
import { fleetReliabilityApis } from "./api-fleet-reliability";
import { meApis } from "./api-me";
import { meteringApis } from "./api-metering";
import { notificationPreferencesApis } from "./api-notification-preferences";
import { securityEventApis } from "./api-security-events";
import { siteTariffApis } from "./api-site-tariff";
import { siteVisitApis } from "./api-site-visits";
import { siteApis } from "./api-sites";
import { statusHistoryApis } from "./api-status-history";
import { uptimeApis } from "./api-uptime";

export const api = {
  AccessRequests: accessRequestApis,
  ChargePoints: chargePointApis,
  CommissioningToken: commissioningTokenApis,
  DeviceEvents: deviceEventApis,
  DeviceVariableReports: deviceVariableReportApis,
  DisplayMessages: displayMessageApis,
  FirmwareCampaigns: firmwareCampaignApis,
  FleetReliability: fleetReliabilityApis,
  Me: meApis,
  Metering: meteringApis,
  NotificationPreferences: notificationPreferencesApis,
  SecurityEvents: securityEventApis,
  Sites: siteApis,
  SiteTariff: siteTariffApis,
  SiteVisits: siteVisitApis,
  StatusHistory: statusHistoryApis,
  Uptime: uptimeApis,
};
