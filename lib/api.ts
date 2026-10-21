import { accessRequestApis } from "./api-access-requests";
import { certificateApis } from "./api-certificates";
import { chargePointAlertApis } from "./api-charge-point-alerts";
import { chargePointApis } from "./api-charge-points";
import { chargePointAlertThresholdsApis } from "./api-charge-points-alert-thresholds";
import { chargingSessionApis } from "./api-charging-sessions";
import { commissioningTokenApis } from "./api-commissioning-token";
import { contactApis } from "./api-contact";
import { deviceEventApis } from "./api-device-events";
import { deviceVariableReportApis } from "./api-device-variable-reports";
import { displayMessageCommandApis } from "./api-display-message-commands";
import { displayMessageApis } from "./api-display-messages";
import { firmwareCampaignApis } from "./api-firmware-campaigns";
import { firmwareUpdateApis } from "./api-firmware-updates";
import { fleetReliabilityApis } from "./api-fleet-reliability";
import { logUploadApis } from "./api-log-uploads";
import { meApis } from "./api-me";
import { meteringApis } from "./api-metering";
import { notificationPreferencesApis } from "./api-notification-preferences";
import { pushSubscriptionApis } from "./api-push-subscriptions";
import { securityEventApis } from "./api-security-events";
import { siteAlertThresholdsApis } from "./api-site-alert-thresholds";
import { siteTariffApis } from "./api-site-tariff";
import { siteVisitApis } from "./api-site-visits";
import { siteApis } from "./api-sites";
import { statusHistoryApis } from "./api-status-history";
import { uptimeApis } from "./api-uptime";

// `api.ChargePoints` is the one call surface the dashboard uses for everything
// that targets a charge point; the feature modules above keep each OCPP
// feature's request/outcome types and calls together, and are composed here.
const chargePointsApi = {
  ...chargePointApis,
  ...chargePointAlertApis,
  ...certificateApis,
  ...chargingSessionApis,
  ...displayMessageCommandApis,
  ...firmwareUpdateApis,
  ...logUploadApis,
};

export const api = {
  AccessRequests: accessRequestApis,
  ChargePoints: chargePointsApi,
  CommissioningToken: commissioningTokenApis,
  Contact: contactApis,
  DeviceEvents: deviceEventApis,
  DeviceVariableReports: deviceVariableReportApis,
  DisplayMessages: displayMessageApis,
  FirmwareCampaigns: firmwareCampaignApis,
  FleetReliability: fleetReliabilityApis,
  Me: meApis,
  Metering: meteringApis,
  NotificationPreferences: notificationPreferencesApis,
  PushSubscriptions: pushSubscriptionApis,
  SecurityEvents: securityEventApis,
  Sites: siteApis,
  SiteTariff: siteTariffApis,
  SiteAlertThresholds: siteAlertThresholdsApis,
  ChargePointAlertThresholds: chargePointAlertThresholdsApis,
  SiteVisits: siteVisitApis,
  StatusHistory: statusHistoryApis,
  Uptime: uptimeApis,
};
