import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Datepicker } from "@/components/ui/datepicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { FormDialog } from "../../components/common/FormDialog";

const logSiteVisitSchema = z.object({
  visitedAt: z.date(),
  note: z.string().optional(),
});

export type LogSiteVisitValues = z.infer<typeof logSiteVisitSchema>;

type LogSiteVisitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LogSiteVisitValues) => void;
  isSubmitting?: boolean;
};

/**
 * Logs a visit against `POST /api/sites/:id/visits` (charge-points-server
 * issue #531) — the only way to change a site's visit history now that
 * `SiteFormDialog` no longer accepts `lastVisitedAt` directly (ADR 0015).
 */
export const LogSiteVisitDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: LogSiteVisitDialogProps) => {
  const t = useTranslations("");
  const form = useForm<LogSiteVisitValues>({
    resolver: zodResolver(logSiteVisitSchema),
    defaultValues: { visitedAt: undefined, note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ visitedAt: new Date(), note: "" });
  }, [open, form]);

  const handleSubmit = (values: LogSiteVisitValues) => {
    onSubmit(values);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[440px]"
      icon={<CalendarCheck className="h-5 w-5 text-primary" />}
      title={t("appPage.sites.detail.visits.logDialog.title")}
      description={t("appPage.sites.detail.visits.logDialog.description")}
      cancelLabel={t("appPage.sites.form.buttons.cancel")}
      submitLabel={t("appPage.sites.detail.visits.logDialog.submit")}
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      isLoading={isSubmitting}
      form={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="visitedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("appPage.sites.detail.visits.logDialog.fields.visitedAt")}
                  </FormLabel>
                  <FormControl>
                    <Datepicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t(
                        "appPage.sites.detail.visits.logDialog.fields.visitedAtPlaceholder",
                      )}
                      disabled={(date) => date > new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.sites.detail.visits.logDialog.fields.note")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "appPage.sites.detail.visits.logDialog.fields.notePlaceholder",
                      )}
                      {...field}
                    />
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
