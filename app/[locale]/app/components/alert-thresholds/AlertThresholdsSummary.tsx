import {
  ALERT_THRESHOLD_FIELDS,
  type EffectiveAlertThresholds,
} from "@watchborne/charge-points-types";
import { Tag } from "@watchborne/electrons";
import { useTranslations } from "next-intl";

import { useFormatAlertDuration } from "./useFormatAlertDuration";

type AlertThresholdsSummaryProps = {
  effective: EffectiveAlertThresholds;
};

/**
 * The thresholds in force, each with the level it comes from (own override,
 * site or default), as resolved by the backend.
 */
export const AlertThresholdsSummary = ({ effective }: AlertThresholdsSummaryProps) => {
  const t = useTranslations("");
  const formatDuration = useFormatAlertDuration();

  return (
    <dl className="space-y-2 text-sm">
      {ALERT_THRESHOLD_FIELDS.map((field) => (
        <div key={field} className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">
            {t(`appPage.alertThresholds.fields.${field}.label`)}
          </dt>
          <dd className="flex items-center gap-2 font-medium">
            {formatDuration(effective.values[field])}
            <Tag>{t(`appPage.alertThresholds.source.${effective.sources[field]}`)}</Tag>
          </dd>
        </div>
      ))}
    </dl>
  );
};
