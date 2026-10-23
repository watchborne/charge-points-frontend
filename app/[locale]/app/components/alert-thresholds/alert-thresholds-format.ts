import {
  ALERT_THRESHOLD_MAX_MS,
  ALERT_THRESHOLD_MIN_MS,
  type AlertThresholdField,
} from "@watchborne/charge-points-types";

const MS_PER_MINUTE = 60_000;

/** The form edits thresholds in minutes: the bounds the backend enforces, in that unit. */
export const ALERT_THRESHOLD_MIN_MINUTES = ALERT_THRESHOLD_MIN_MS / MS_PER_MINUTE;
export const ALERT_THRESHOLD_MAX_MINUTES = ALERT_THRESHOLD_MAX_MS / MS_PER_MINUTE;

export const msToMinutes = (ms: number): number => Math.round(ms / MS_PER_MINUTE);
export const minutesToMs = (minutes: number): number => minutes * MS_PER_MINUTE;

/** Thresholds as the form holds them: whole minutes as typed, `""` meaning "inherit". */
export type AlertThresholdFormValues = Record<AlertThresholdField, string>;

/**
 * Empty (inherit) or whole minutes within the backend's bounds; spares a round
 * trip, the backend stays the authority.
 */
export const isValidMinutes = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (!/^\d+$/.test(trimmed)) return false;

  const minutes = Number(trimmed);
  return minutes >= ALERT_THRESHOLD_MIN_MINUTES && minutes <= ALERT_THRESHOLD_MAX_MINUTES;
};

/** A duration split into the unit it reads best in, so the caller only translates it. */
export type DurationParts =
  | { unit: "minutes"; minutes: number }
  | { unit: "hours"; hours: number }
  | { unit: "hoursMinutes"; hours: number; minutes: number }
  | { unit: "days"; days: number };

export const splitDuration = (ms: number): DurationParts => {
  const totalMinutes = msToMinutes(ms);
  if (totalMinutes < 60) return { unit: "minutes", minutes: totalMinutes };

  if (totalMinutes % 1_440 === 0) return { unit: "days", days: totalMinutes / 1_440 };
  if (totalMinutes % 60 === 0) return { unit: "hours", hours: totalMinutes / 60 };

  return {
    unit: "hoursMinutes",
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
};

/** What the form starts from: a stored override in minutes, or `""` where it inherits. */
export const overridesToFormValues = (
  overrides: Partial<Record<AlertThresholdField, number | null>> | null,
  fields: readonly AlertThresholdField[],
): AlertThresholdFormValues =>
  Object.fromEntries(
    fields.map((field) => {
      const ms = overrides?.[field];
      return [field, ms == null ? "" : String(msToMinutes(ms))];
    }),
  ) as AlertThresholdFormValues;

/**
 * The partial update to send: every field explicitly, so a field the user
 * emptied goes out as `null` (clear) rather than being left untouched.
 */
export const formValuesToPatch = (
  values: AlertThresholdFormValues,
  fields: readonly AlertThresholdField[],
): Record<AlertThresholdField, number | null> =>
  Object.fromEntries(
    fields.map((field) => {
      const trimmed = values[field].trim();
      return [field, trimmed === "" ? null : minutesToMs(Number(trimmed))];
    }),
  ) as Record<AlertThresholdField, number | null>;
