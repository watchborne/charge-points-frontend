import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock } from "lucide-react";
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

import { FormDialog } from "../../components/common/FormDialog";

const scheduleNextVisitSchema = z.object({
  nextVisitAt: z.date(),
});

export type ScheduleNextVisitValues = z.infer<typeof scheduleNextVisitSchema>;

type ScheduleNextVisitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The currently scheduled date, if any — prefilled when editing an
   * existing plan rather than creating a fresh one. */
  initialNextVisitAt?: Date | null;
  onSubmit: (values: ScheduleNextVisitValues) => void;
  isSubmitting?: boolean;
};

// A day is still "today or later" up to its own midnight — comparing against
// the start of today (not `new Date()`) so picking today itself isn't
// rejected as being in the past by the time the click is processed.
const startOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Plans a site's next visit against `PUT /api/sites/:id/next-visit`
 * (charge-points-server issue #579, ADR 0016) — the proactive counterpart to
 * `LogSiteVisitDialog`'s reactive visit history. Unlike a recorded visit,
 * `nextVisitAt` must be in the future (enforced server-side too).
 */
export const ScheduleNextVisitDialog = ({
  open,
  onOpenChange,
  initialNextVisitAt = null,
  onSubmit,
  isSubmitting = false,
}: ScheduleNextVisitDialogProps) => {
  const t = useTranslations("");
  const form = useForm<ScheduleNextVisitValues>({
    resolver: zodResolver(scheduleNextVisitSchema),
    defaultValues: { nextVisitAt: undefined },
  });

  useEffect(() => {
    if (open) form.reset({ nextVisitAt: initialNextVisitAt ?? undefined });
  }, [open, initialNextVisitAt, form]);

  const handleSubmit = (values: ScheduleNextVisitValues) => {
    onSubmit(values);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[440px]"
      icon={<CalendarClock className="h-5 w-5 text-primary" />}
      title={t("appPage.sites.detail.nextVisit.dialog.title")}
      description={t("appPage.sites.detail.nextVisit.dialog.description")}
      cancelLabel={t("common.actions.cancel")}
      submitLabel={t("appPage.sites.detail.nextVisit.dialog.submit")}
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      isLoading={isSubmitting}
      form={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="nextVisitAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.sites.detail.nextVisit.dialog.fields.date")}</FormLabel>
                  <FormControl>
                    <Datepicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t(
                        "appPage.sites.detail.nextVisit.dialog.fields.datePlaceholder",
                      )}
                      disabled={(date) => date < startOfToday()}
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
