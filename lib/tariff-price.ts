/**
 * A site tariff travels as `pricePerKwhCents`, cents per kWh to 1/100 of a cent
 * (21.42 = 0,2142 EUR/kWh, charge-points-server ADR 0035); the dashboard shows
 * and edits it in the currency unit, up to 4 decimals.
 */
export const TARIFF_PRICE_DECIMALS = 4;

/** Currency unit per kWh (e.g. 0.2142) to the API's cents per kWh (21.42). */
export const priceToCents = (pricePerKwh: number): number =>
  Math.round(pricePerKwh * 10 ** TARIFF_PRICE_DECIMALS) / 100;

/** The API's cents per kWh (21.42) to the currency unit per kWh (0.2142). */
export const centsToPrice = (pricePerKwhCents: number): number =>
  Math.round(pricePerKwhCents * 100) / 10 ** TARIFF_PRICE_DECIMALS;
