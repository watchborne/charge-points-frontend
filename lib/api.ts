import { siteApis } from "./api-sites";
import { chargePointApis } from "./api-charge-points";

export { API_URL } from "./constants";

export const api = {
  ChargePoints: chargePointApis,
  Sites: siteApis,
};
