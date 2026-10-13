import { zodResolver } from "@hookform/resolvers/zod";
import {
  ALERT_THRESHOLD_FIELDS,
  type AlertThresholdOverrides,
  type EffectiveAlertThresholds,
  type UpdateAlertThresholds,
} from "@watchborne/charge-points-types";
import { Input, FormDialog } from "@watchborne/electrons";
import { BellRing } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  ALERT_THRESHOLD_MAX_MINUTES,
  ALERT_THRESHOLD_MIN_MINUTES,
  formValuesToPatch,
  isValidMinutes,
  overridesToFormValues,
  type AlertThresholdFormValues,
} from "./alert-thresholds-format";
import { useFormatAlertDuration } from "./useFormatAlertDuration";

type AlertThresholdsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** The level's own stored overrides, or `null` when it has none. */
  overrides: AlertThresholdOverrides | null;
  /** What is applied today, shown under each field so "inherit" is not a blind choice. */
  effective: EffectiveAlertThresholds | null;
  onSubmit: (patch: UpdateAlertThresholds) => void;
  isSubmitting?: boolean;
};

/**
 * Edits one level's alert-threshold overrides (charge-points-server issue #577).
 * Used for a site and for a charge point alike: the caller supplies the wording
 * and the level's stored overrides, this owns the form.
 *
 * Thresholds are typed in whole minutes. An empty field means "inherit", sent as
 * `null` so it clears an override that was set; a number sets it. Every field is
 * sent, so what the form shows is exactly what ends up stored.
 */
export const AlertThresholdsDialog = ({
  open,
  onOpenChange,
  title,
  description,
  overrides,
  effective,
  onSubmit,
  isSubmitting = false,
}: AlertThresholdsDialogProps) => {
  const t = useTranslations("");
  const formatDuration = useFormatAlertDuration();

  const schema = useMemo(() => {
    const minutesField = z.string().refine(isValidMinutes, {
      message: t("appPage.alertThresholds.dialog.rangeError", {
        min: ALERT_THRESHOLD_MIN_MINUTES,
        max: ALERT_THRESHOLD_MAX_MINUTES,
      }),
    });

    return z.object(
      Object.fromEntries(ALERT_THRESHOLD_FIELDS.map((field) => [field, minutesField])) as Record<
        (typeof ALERT_THRESHOLD_FIELDS)[number],
        typeof minutesField
      >,
    );
  }, [t]);

  const form = useForm<AlertThresholdFormValues>({
    resolver: zodResolver(schema),
    defaultValues: overridesToFormValues(overrides, ALERT_THRESHOLD_FIELDS),
  });

  useEffect(() => {
    if (open) form.reset(overridesToFormValues(overrides, ALERT_THRESHOLD_FIELDS));
  }, [open, overrides, form]);

  const handleSubmit = (values: AlertThresholdFormValues) => {
    onSubmit(formValuesToPatch(values, ALERT_THRESHOLD_FIELDS));
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[480px]"
      icon={<BellRing className="h-5 w-5 text-primary" />}
      title={title}
      description={description}
      cancelLabel={t("common.actions.cancel")}
      closeLabel={t("common.close")}
      submitLabel={t("common.actions.save")}
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      isLoading={isSubmitting}
      form={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            {ALERT_THRESHOLD_FIELDS.map((field) => (
              <FormField
                key={field}
                control={form.control}
                name={field}
                render={({ field: input }) => (
                  <FormItem>
                    <FormLabel>{t(`appPage.alertThresholds.fields.${field}.label`)}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={ALERT_THRESHOLD_MIN_MINUTES}
                        max={ALERT_THRESHOLD_MAX_MINUTES}
                        step={1}
                        placeholder={t("appPage.alertThresholds.dialog.inheritPlaceholder")}
                        {...input}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(`appPage.alertThresholds.fields.${field}.help`)}
                      {effective &&
                        ` ${t("appPage.alertThresholds.dialog.currentlyApplied", {
                          value: formatDuration(effective.values[field]),
                        })}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <p className="text-xs text-muted-foreground">
              {t("appPage.alertThresholds.dialog.unitHint", {
                min: ALERT_THRESHOLD_MIN_MINUTES,
                max: ALERT_THRESHOLD_MAX_MINUTES,
              })}
            </p>
          </form>
        </Form>
      }
    />
  );
};
