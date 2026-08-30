"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Site } from "@watchborne/charge-points-types";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
} from "@watchborne/electrons";
import classNames from "classnames";
import { Zap, ChevronDown, Server } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";

import { SiteCombobox } from "./SiteCombobox";
import { FormDialog } from "../../components/common/FormDialog";

type ChargePointFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<ChargePointFormValues>;
  onSubmit: (values: ChargePointFormValues) => void;
  mode: "create" | "edit";
  sites: Site[];
  defaultSiteId?: string | null;
};

const metaSchema = z
  .object({
    vendor: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    firmwareVersion: z.string().optional(),
  })
  .optional();

// A charge point may be left unassigned (no site) — an empty string, mapped
// to `null` by the page before it hits the API.
const siteIdSchema = z.string();
const isActiveSchema = z.boolean();

/**
 * `name` is optional on create (ADR 0010, charge-points-server): it is a
 * cosmetic label with no uniqueness constraint, so an installer with no name
 * in mind isn't forced to invent one — the backend generates a readable one
 * instead. Renaming an existing charge point is still a deliberate act, so
 * `edit` keeps the field required.
 */
const createChargePointSchema = z.object({
  name: z.string().optional(),
  siteId: siteIdSchema,
  isActive: isActiveSchema,
  meta: metaSchema,
});

const editChargePointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  siteId: siteIdSchema,
  isActive: isActiveSchema,
  meta: metaSchema,
});

// The wider of the two shapes (name optional): both `onSubmit` consumers
// (create and edit) already forward `values.name` into an optional field —
// `handleEdit`'s patch is `Partial<CreateChargePointBody>` — and edit mode's
// own resolver is what actually enforces non-empty before submission.
export type ChargePointFormValues = z.infer<typeof createChargePointSchema>;

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
    resolver: zodResolver(mode === "create" ? createChargePointSchema : editChargePointSchema),
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[520px]"
      icon={<Zap className="h-5 w-5 text-primary" />}
      title={
        mode === "create"
          ? t("appPage.chargePoints.form.createTitle")
          : t("appPage.chargePoints.form.editTitle")
      }
      description={
        mode === "create"
          ? t("appPage.chargePoints.form.createDescription")
          : t("appPage.chargePoints.form.editDescription")
      }
      cancelLabel={t("appPage.chargePoints.form.buttons.cancel")}
      submitLabel={
        mode === "create"
          ? t("appPage.chargePoints.form.buttons.create")
          : t("appPage.chargePoints.form.buttons.save")
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
                  <FormLabel>{t("appPage.chargePoints.form.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        mode === "create"
                          ? t("appPage.chargePoints.form.fields.nameCreatePlaceholder")
                          : t("appPage.chargePoints.form.fields.namePlaceholder")
                      }
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
          </form>
        </Form>
      }
    />
  );
};
