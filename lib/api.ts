import { chargePointApis } from "./api-charge-points";
import { meApis } from "./api-me";
import { siteApis } from "./api-sites";

export const api = {
  ChargePoints: chargePointApis,
  Sites: siteApis,
  Me: meApis,
};
