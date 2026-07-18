"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Site } from "@watchborne/charge-points-types";
import { PlugZap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { CommissioningChecklist } from "./CommissioningChecklist";
import { SiteCombobox } from "./SiteCombobox";

const commissioningSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Optional: an installer may rename now and assign a site later. Empty maps to
  // null (still unassigned) at the API boundary.
  siteId: z.string(),
});

export type CommissioningFormValues = z.infer<typeof commissioningSchema>;

type CommissioningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargePoint: ChargePointWithConnectors | null;
  sites: Site[];
  onCommission: (values: { name: string; siteId: string | null }) => Promise<void> | void;
};

/**
 * Guided commissioning of a discovered charge point: rename it (its name is the
 * raw OCPP station id until an installer sets a human one) and attach it to a
 * site. Distinct from the edit dialog, which locks the name — renaming is the
 * point here.
 */
export const CommissioningDialog = ({
  open,
  onOpenChange,
  chargePoint,
  sites,
  onCommission,
}: CommissioningDialogProps) => {
  const t = useTranslations("");

  const form = useForm<CommissioningFormValues>({
    resolver: zodResolver(commissioningSchema),
    defaultValues: { name: "", siteId: "" },
  });

  useEffect(() => {
    if (open && chargePoint) {
      form.reset({ name: chargePoint.name, siteId: chargePoint.siteId ?? "" });
    }
  }, [open, chargePoint, form]);

  const handleSubmit = async (values: CommissioningFormValues) => {
    await onCommission({ name: values.name.trim(), siteId: values.siteId || null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-charge-strong" />
            {t("appPage.chargePoints.commissioning.dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("appPage.chargePoints.commissioning.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        {chargePoint && <CommissioningChecklist chargePoint={chargePoint} />}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.chargePoints.form.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("appPage.chargePoints.form.fields.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.chargePoints.form.fields.site")}</FormLabel>
                  <FormControl>
                    <SiteCombobox value={field.value} onChange={field.onChange} sites={sites} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("appPage.chargePoints.form.buttons.cancel")}
              </Button>
              <Button type="submit">{t("appPage.chargePoints.commissioning.dialog.submit")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
