import { accessRequestApis } from "./api-access-requests";
import { chargePointApis } from "./api-charge-points";
import { commissioningTokenApis } from "./api-commissioning-token";
import { meApis } from "./api-me";
import { siteApis } from "./api-sites";

export const api = {
  AccessRequests: accessRequestApis,
  ChargePoints: chargePointApis,
  Sites: siteApis,
  Me: meApis,
  CommissioningToken: commissioningTokenApis,
};
