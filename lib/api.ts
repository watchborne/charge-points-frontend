import { accessRequestApis } from "./api-access-requests";
import { chargePointApis } from "./api-charge-points";
import { meApis } from "./api-me";
import { siteApis } from "./api-sites";

export const api = {
  AccessRequests: accessRequestApis,
  ChargePoints: chargePointApis,
  Sites: siteApis,
  Me: meApis,
};
