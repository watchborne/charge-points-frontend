import { accessRequestApis } from "./api-access-requests";
import { chargePointApis } from "./api-charge-points";
import { commissioningTokenApis } from "./api-commissioning-token";
import { meApis } from "./api-me";
import { meteringApis } from "./api-metering";
import { securityEventApis } from "./api-security-events";
import { siteApis } from "./api-sites";
import { statusHistoryApis } from "./api-status-history";

export const api = {
  AccessRequests: accessRequestApis,
  ChargePoints: chargePointApis,
  Sites: siteApis,
  Me: meApis,
  CommissioningToken: commissioningTokenApis,
  Metering: meteringApis,
  StatusHistory: statusHistoryApis,
  SecurityEvents: securityEventApis,
};
