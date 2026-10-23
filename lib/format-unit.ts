/**
 * OCPP's `"Percent"` unit as `%`, case-insensitive since stations don't case
 * it consistently.
 */
export const formatUnit = (unit?: string): string =>
  unit?.toLowerCase() === "percent" ? "%" : (unit ?? "");
