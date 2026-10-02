"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@watchborne/electrons";
import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Datepicker } from "@/components/ui/datepicker";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FirmwareCampaignTargetMode } from "@/lib/api-firmware-campaigns";

import { FormDialog } from "../../components/common/FormDialog";
import { useChargePoints } from "../../hooks/useChargePoints";
import { useSites } from "../../hooks/useSites";

// A day is still "today or later" up to its own midnight — comparing against
// the start of today (not `new Date()`) so picking today itself isn't
// rejected as being in the past by the time the click is processed. Mirrors
// ScheduleNextVisitDialog's own helper.
const startOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const TARGET_MODES: readonly FirmwareCampaignTargetMode[] = ["SITE", "LIST", "FLEET"];

/**
 * The form's own zod schema, built from `t` so the conditional-field and
 * future-date checks it backstops the backend's `400` with (see
 * `api-firmware-campaigns.ts`'s `CreateFirmwareCampaignBody` JSDoc) show
 * translated messages — this dashboard has no existing precedent for a
 * translated zod schema (its couple of other inline schemas hardcode English
 * strings), but `CLAUDE.md`'s i18n rule applies to every user-facing string,
 * validation messages included.
 */
const buildCreateFirmwareCampaignSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      name: z.string().trim().min(1, t("appPage.firmwareCampaigns.create.validation.nameRequired")),
      targetLocation: z
        .string()
        .trim()
        .url(t("appPage.firmwareCampaigns.create.validation.targetLocationInvalid")),
      toVersion: z.string().trim().optional(),
      retrieveDateTime: z
        .string()
        .min(1, t("appPage.firmwareCampaigns.create.validation.retrieveDateTimeRequired")),
      targetMode: z.enum(["SITE", "LIST", "FLEET"] as const),
      targetSiteId: z.string().optional(),
      targetChargePointIds: z.array(z.string()),
      scheduledAt: z.date().optional(),
      staggerMs: z.number().int().nonnegative().optional(),
    })
    .refine((data) => data.targetMode !== "SITE" || Boolean(data.targetSiteId), {
      message: t("appPage.firmwareCampaigns.create.validation.targetSiteRequired"),
      path: ["targetSiteId"],
    })
    .refine((data) => data.targetMode !== "LIST" || data.targetChargePointIds.length > 0, {
      message: t("appPage.firmwareCampaigns.create.validation.targetChargePointsRequired"),
      path: ["targetChargePointIds"],
    })
    .refine((data) => data.scheduledAt === undefined || data.scheduledAt >= startOfToday(), {
      message: t("appPage.firmwareCampaigns.create.validation.scheduledAtPast"),
      path: ["scheduledAt"],
    });

export type CreateFirmwareCampaignValues = z.infer<
  ReturnType<typeof buildCreateFirmwareCampaignSchema>
>;

const DEFAULT_VALUES: CreateFirmwareCampaignValues = {
  name: "",
  targetLocation: "",
  toVersion: "",
  retrieveDateTime: "",
  targetMode: "FLEET",
  targetSiteId: undefined,
  targetChargePointIds: [],
  scheduledAt: undefined,
  staggerMs: undefined,
};

type CreateFirmwareCampaignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateFirmwareCampaignValues) => void;
  isSubmitting?: boolean;
};

/**
 * Creates/schedules a fleet-wide firmware campaign against
 * `POST /api/firmware-campaigns`. Mirrors `ScheduleNextVisitDialog`'s
 * contract: it only calls `onSubmit` and leaves closing the dialog to the
 * caller, so a backend rejection (an out-of-scope `targetSiteId`, mainly —
 * everything else is caught client-side first) can surface without losing
 * the form's contents.
 */
export const CreateFirmwareCampaignDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateFirmwareCampaignDialogProps) => {
  const t = useTranslations("");
  const { sites } = useSites();
  const { chargePoints } = useChargePoints();

  const schema = useMemo(() => buildCreateFirmwareCampaignSchema(t), [t]);

  const form = useForm<CreateFirmwareCampaignValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) form.reset(DEFAULT_VALUES);
  }, [open, form]);

  const targetMode = form.watch("targetMode");
  const selectedChargePointIds = form.watch("targetChargePointIds");

  const handleSubmit = (values: CreateFirmwareCampaignValues) => {
    onSubmit(values);
  };

  const toggleChargePoint = (id: string, checked: boolean) => {
    const current = form.getValues("targetChargePointIds");
    form.setValue(
      "targetChargePointIds",
      checked ? [...current, id] : current.filter((existingId) => existingId !== id),
      { shouldValidate: true },
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[520px]"
      icon={<UploadCloud className="h-5 w-5 text-primary" />}
      title={t("appPage.firmwareCampaigns.create.title")}
      description={t("appPage.firmwareCampaigns.create.description")}
      cancelLabel={t("common.actions.cancel")}
      submitLabel={t("appPage.firmwareCampaigns.create.submit")}
      onSubmit={() => form.handleSubmit(handleSubmit)()}
      isLoading={isSubmitting}
      form={
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="max-h-[65vh] space-y-4 overflow-y-auto py-2 pr-1"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.firmwareCampaigns.create.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("appPage.firmwareCampaigns.create.fields.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("appPage.firmwareCampaigns.create.fields.targetLocation")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "appPage.firmwareCampaigns.create.fields.targetLocationPlaceholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("appPage.firmwareCampaigns.create.fields.targetLocationDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.firmwareCampaigns.create.fields.toVersion")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "appPage.firmwareCampaigns.create.fields.toVersionPlaceholder",
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
              name="retrieveDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("appPage.firmwareCampaigns.create.fields.retrieveDateTime")}
                  </FormLabel>
                  <FormControl>
                    {/* `datetime-local` reuses StartLogUploadDialog's own pattern for a
                        date+time field this dashboard has no react-hook-form-integrated
                        primitive for — `Datepicker` (used below for `scheduledAt`) has
                        no time component, and this value needs one (it's the instant a
                        station should fetch its firmware, not just a day). */}
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.firmwareCampaigns.create.fields.targetMode")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as FirmwareCampaignTargetMode)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TARGET_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {t(`appPage.firmwareCampaigns.create.fields.targetModeOptions.${mode}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetMode === "SITE" && (
              <FormField
                control={form.control}
                name="targetSiteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appPage.firmwareCampaigns.create.fields.targetSite")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "appPage.firmwareCampaigns.create.fields.targetSitePlaceholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {targetMode === "LIST" && (
              <FormField
                control={form.control}
                name="targetChargePointIds"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      {t("appPage.firmwareCampaigns.create.fields.targetChargePoints")}
                    </FormLabel>
                    <FormControl>
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                        {chargePoints.length === 0 && (
                          <span className="text-sm text-muted-foreground">
                            {t("appPage.firmwareCampaigns.create.fields.targetChargePointsEmpty")}
                          </span>
                        )}
                        {chargePoints.map((chargePoint) => (
                          <label
                            key={chargePoint.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-input"
                              checked={selectedChargePointIds.includes(chargePoint.id)}
                              onChange={(event) =>
                                toggleChargePoint(chargePoint.id, event.target.checked)
                              }
                            />
                            {chargePoint.name}
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.firmwareCampaigns.create.fields.scheduledAt")}</FormLabel>
                  <FormControl>
                    <Datepicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t(
                        "appPage.firmwareCampaigns.create.fields.scheduledAtPlaceholder",
                      )}
                      disabled={(date) => date < startOfToday()}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("appPage.firmwareCampaigns.create.fields.scheduledAtDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staggerMs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appPage.firmwareCampaigns.create.fields.staggerMs")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? undefined : Number(event.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {t("appPage.firmwareCampaigns.create.fields.staggerMsDescription")}
                  </FormDescription>
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
