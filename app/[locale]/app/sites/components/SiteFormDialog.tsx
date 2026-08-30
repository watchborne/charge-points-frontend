import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@watchborne/electrons";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Datepicker } from "@/components/ui/datepicker";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";

import { FormDialog } from "../../components/common/FormDialog";

const siteFormSchema = z.object({
  name: z.string(),
  customer: z.string(),
  installedAt: z.date(),
  lastVisitedAt: z.date(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;

type SiteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<SiteFormValues>;
  onSubmit: (values: SiteFormValues) => void;
  mode: "create" | "edit";
};

export const SiteFormDialog = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode,
}: SiteFormDialogProps) => {
  const t = useTranslations("");
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      customer: initialValues?.customer ?? "",
      installedAt: initialValues?.installedAt,
      lastVisitedAt: initialValues?.lastVisitedAt,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name ?? "",
        customer: initialValues?.customer ?? "",
        installedAt: initialValues?.installedAt,
        lastVisitedAt: initialValues?.lastVisitedAt,
      });
    }
  }, [open, initialValues, form]);

  const handleSubmit = (values: SiteFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[480px]"
      icon={<Globe className="h-5 w-5 text-primary" />}
      title={
        mode === "create" ? t("appPage.sites.form.createTitle") : t("appPage.sites.form.editTitle")
      }
      description={
        mode === "create"
          ? t("appPage.sites.form.createDescription")
          : t("appPage.sites.form.editDescription")
      }
      cancelLabel={t("appPage.sites.form.buttons.cancel")}
      submitLabel={
        mode === "create"
          ? t("appPage.sites.form.buttons.create")
          : t("appPage.sites.form.buttons.save")
      }
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      form={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.sites.form.fields.siteName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("appPage.sites.form.fields.siteNamePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.sites.form.fields.customerName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("appPage.sites.form.fields.customerNamePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="installedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appPage.sites.form.fields.installDate")}</FormLabel>
                    <FormControl>
                      <Datepicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("appPage.sites.form.fields.installDatePlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastVisitedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appPage.sites.form.fields.lastVisit")}</FormLabel>
                    <FormControl>
                      <Datepicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("appPage.sites.form.fields.lastVisitPlaceholder")}
                        disabled={(date) => date > new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      }
    />
  );
};
