import { zodResolver } from "@hookform/resolvers/zod";
import { Input, FormDialog } from "@watchborne/electrons";
import { Coins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const siteTariffFormSchema = z.object({
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  pricePerKwh: z.coerce.number().min(0),
});

// `pricePerKwh` is coerced from a string, so input and output types differ:
// `useForm` needs both for `onSubmit` to get the coerced value.
type SiteTariffFormInput = z.input<typeof siteTariffFormSchema>;
export type SiteTariffFormValues = z.output<typeof siteTariffFormSchema>;

type SetSiteTariffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<SiteTariffFormValues>;
  onSubmit: (values: SiteTariffFormValues) => void;
  isSubmitting?: boolean;
};

/**
 * Sets a site's flat tariff (`PUT /api/sites/:id/tariff`). Not historized: it
 * replaces the rate for future estimates. `pricePerKwh` is in the currency
 * unit; the caller converts it to cents (4 decimals of the unit).
 */
export const SetSiteTariffDialog = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
}: SetSiteTariffDialogProps) => {
  const t = useTranslations("");
  const form = useForm<SiteTariffFormInput, unknown, SiteTariffFormValues>({
    resolver: zodResolver(siteTariffFormSchema),
    defaultValues: {
      currency: initialValues?.currency ?? "EUR",
      pricePerKwh: initialValues?.pricePerKwh ?? 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        currency: initialValues?.currency ?? "EUR",
        pricePerKwh: initialValues?.pricePerKwh ?? 0,
      });
    }
  }, [open, initialValues, form]);

  const handleSubmit = (values: SiteTariffFormValues) => {
    onSubmit(values);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[420px]"
      icon={<Coins className="h-5 w-5 text-primary" />}
      title={t("appPage.sites.detail.tariff.dialog.title")}
      description={t("appPage.sites.detail.tariff.dialog.description")}
      cancelLabel={t("common.actions.cancel")}
      closeLabel={t("common.close")}
      submitLabel={t("common.actions.save")}
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      isLoading={isSubmitting}
      form={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="pricePerKwh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("appPage.sites.detail.tariff.dialog.fields.pricePerKwh")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.sites.detail.tariff.dialog.fields.currency")}</FormLabel>
                  <FormControl>
                    <Input maxLength={3} className="uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      }
    />
  );
};
