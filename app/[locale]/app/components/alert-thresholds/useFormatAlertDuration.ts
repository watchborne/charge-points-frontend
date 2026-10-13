import { useTranslations } from "next-intl";

import { splitDuration } from "./alert-thresholds-format";

/**
 * Formats an alert threshold (milliseconds) as "45 min", "1 h", "4 h 30", "2 d",
 * in the language of the UI. The wording lives in the translations; the
 * arithmetic in `splitDuration`.
 */
export const useFormatAlertDuration = () => {
  const t = useTranslations("");

  return (ms: number): string => {
    const parts = splitDuration(ms);

    switch (parts.unit) {
      case "minutes":
        return t("appPage.alertThresholds.duration.minutes", { minutes: parts.minutes });
      case "hours":
        return t("appPage.alertThresholds.duration.hours", { hours: parts.hours });
      case "hoursMinutes":
        return t("appPage.alertThresholds.duration.hoursMinutes", {
          hours: parts.hours,
          minutes: parts.minutes,
        });
      case "days":
        return t("appPage.alertThresholds.duration.days", { days: parts.days });
    }
  };
};
