"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { Zap, ChevronDown, Server } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SiteCombobox } from "./SiteCombobox";

type ChargePointFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<ChargePointFormValues>;
  onSubmit: (values: ChargePointFormValues) => void;
  mode: "create" | "edit";
  sites: Site[];
  defaultSiteId?: string | null;
};

const chargePointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // A charge point may be left unassigned (no site) — an empty string, mapped
  // to `null` by the page before it hits the API.
  siteId: z.string(),
  isActive: z.boolean(),
  meta: z
    .object({
      vendor: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      firmwareVersion: z.string().optional(),
    })
    .optional(),
});

export type ChargePointFormValues = z.infer<typeof chargePointSchema>;

export const ChargePointFormDialog = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode,
  sites,
  defaultSiteId,
}: ChargePointFormDialogProps) => {
  const t = useTranslations("");
  const [metaOpen, setMetaOpen] = useState(false);

  const form = useForm<ChargePointFormValues>({
    resolver: zodResolver(chargePointSchema),
    defaultValues: {
      name: "",
      siteId: defaultSiteId ?? "",
      isActive: true,
      meta: {
        vendor: "",
        model: "",
        serialNumber: "",
        firmwareVersion: "",
      },
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name ?? "",
        siteId: initialValues?.siteId ?? defaultSiteId ?? "",
        isActive: initialValues?.isActive ?? true,
        meta: {
          vendor: initialValues?.meta?.vendor ?? "",
          model: initialValues?.meta?.model ?? "",
          serialNumber: initialValues?.meta?.serialNumber ?? "",
          firmwareVersion: initialValues?.meta?.firmwareVersion ?? "",
        },
      });
      setMetaOpen(false);
    }
  }, [open, form, initialValues, defaultSiteId]);

  const handleSubmit = (values: ChargePointFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {mode === "create"
              ? t("appPage.chargePoints.form.createTitle")
              : t("appPage.chargePoints.form.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("appPage.chargePoints.form.createDescription")
              : t("appPage.chargePoints.form.editDescription")}
          </DialogDescription>
        </DialogHeader>

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
                      disabled={mode === "edit"}
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

            <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground border border-dashed"
                >
                  <span className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {t("appPage.chargePoints.form.fields.technicalInformation")}
                  </span>
                  <ChevronDown
                    className={classNames(
                      "h-4 w-4 transition-transform duration-200",
                      metaOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="meta.vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("appPage.chargePoints.form.fields.vendor")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("appPage.chargePoints.form.fields.vendorPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("appPage.chargePoints.form.fields.model")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("appPage.chargePoints.form.fields.modelPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("appPage.chargePoints.form.fields.serialNumber")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "appPage.chargePoints.form.fields.serialNumberPlaceholder",
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meta.firmwareVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("appPage.chargePoints.form.fields.firmware")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("appPage.chargePoints.form.fields.firmwarePlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("appPage.chargePoints.form.buttons.cancel")}
              </Button>
              <Button type="submit">
                {mode === "create"
                  ? t("appPage.chargePoints.form.buttons.create")
                  : t("appPage.chargePoints.form.buttons.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
