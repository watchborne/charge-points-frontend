/**
 * OCPP reports the percent unit as the literal string `"Percent"` rather
 * than the `%` symbol a reader expects next to a State-of-Charge or
 * connection-quality figure. Every unit label in the charge-points UI
 * (consumption panels/tiles, connector status, `ConsumptionChart`) needs
 * this same swap, so it's factored out here rather than repeated per call
 * site — case-insensitive since OCPP's `UnitOfMeasure` enum values aren't
 * consistently cased across stations in the wild.
 */
export const formatUnit = (unit?: string): string =>
  unit?.toLowerCase() === "percent" ? "%" : (unit ?? "");
