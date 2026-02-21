import { siteApis } from "./api-sites";
import { chargePointApis } from "./api-charge-points";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = {
  ChargePoints: chargePointApis,
  Sites: siteApis,
};
