import { accessRequestApis } from "./api-access-requests";
import { chargePointApis } from "./api-charge-points";
import { commissioningTokenApis } from "./api-commissioning-token";
import { deviceEventApis } from "./api-device-events";
import { deviceVariableReportApis } from "./api-device-variable-reports";
import { meApis } from "./api-me";
import { meteringApis } from "./api-metering";
import { securityEventApis } from "./api-security-events";
import { siteApis } from "./api-sites";
import { statusHistoryApis } from "./api-status-history";
import { uptimeApis } from "./api-uptime";

export const api = {
  AccessRequests: accessRequestApis,
  ChargePoints: chargePointApis,
  CommissioningToken: commissioningTokenApis,
  DeviceEvents: deviceEventApis,
  DeviceVariableReports: deviceVariableReportApis,
  Me: meApis,
  Metering: meteringApis,
  SecurityEvents: securityEventApis,
  Sites: siteApis,
  StatusHistory: statusHistoryApis,
  Uptime: uptimeApis,
};
