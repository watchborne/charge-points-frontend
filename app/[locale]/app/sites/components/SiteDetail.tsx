import { Site } from "@watchborne/charge-points-types";
import { Button } from "@watchborne/electrons";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  Coins,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { useDateFormat } from "@/lib/date-format";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { LogSiteVisitDialog, LogSiteVisitValues } from "./LogSiteVisitDialog";
import { ScheduleNextVisitDialog, ScheduleNextVisitValues } from "./ScheduleNextVisitDialog";
import { SetSiteTariffDialog, SiteTariffFormValues } from "./SetSiteTariffDialog";
import { SiteChargePointsList } from "./SiteChargePointsList";
import { SiteReliabilityValue } from "./SiteReliabilityValue";
import { SiteReportExportButton } from "./SiteReportExportButton";
import { useSiteTariff } from "../../hooks/useSiteTariff";
import { useSiteVisitSchedule } from "../../hooks/useSiteVisitSchedule";
import { useSiteVisits } from "../../hooks/useSiteVisits";

type SiteDetailProps = {
  site: Site;
  chargePoints: ChargePointWithConnectors[];
  onEditClicked: (site: Site) => void;
  onDeleteClicked: (site: Site) => void;
};

export const SiteDetail = ({
  site,
  chargePoints,
  onEditClicked,
  onDeleteClicked,
}: SiteDetailProps) => {
  const t = useTranslations("");
  const { formatRelative } = useDateFormat();
  const format = useFormatter();
  const router = useRouter();
  const [logVisitOpen, setLogVisitOpen] = useState(false);
  const [tariffDialogOpen, setTariffDialogOpen] = useState(false);
  const [scheduleVisitOpen, setScheduleVisitOpen] = useState(false);
  const {
    visits,
    loading: visitsLoading,
    error: visitsError,
    recordVisit,
    isRecording,
  } = useSiteVisits(site.id);
  const {
    tariff,
    loading: tariffLoading,
    error: tariffError,
    upsertTariff,
    isSaving: isSavingTariff,
  } = useSiteTariff(site.id);
  const {
    schedule,
    loading: scheduleLoading,
    scheduleNextVisit,
    isScheduling,
    cancelNextVisit,
    isCanceling,
  } = useSiteVisitSchedule(site.id);

  const siteChargePoints = chargePoints.filter((cp) => cp.siteId === site.id);

  const handleLogVisit = async (values: LogSiteVisitValues) => {
    await recordVisit({
      visitedAt: values.visitedAt.toISOString(),
      note: values.note || undefined,
    });
    setLogVisitOpen(false);
  };

  const handleSetTariff = async (values: SiteTariffFormValues) => {
    await upsertTariff({
      currency: values.currency,
      pricePerKwhCents: Math.round(values.pricePerKwh * 100),
    });
    setTariffDialogOpen(false);
  };

  const handleScheduleNextVisit = async (values: ScheduleNextVisitValues) => {
    await scheduleNextVisit(values.nextVisitAt.toISOString());
    setScheduleVisitOpen(false);
  };

  const handleCancelNextVisit = async () => {
    await cancelNextVisit();
  };

  const dateOptions = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const sectionClass = "space-y-3 rounded-xl border bg-card p-4 shadow-sm sm:p-6";

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/app/sites"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("appPage.sites.detail.backToSites")}
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold">{site.name}</h1>
                <p className="mt-1 truncate text-sm text-muted-foreground">{site.customer}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => onEditClicked(site)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </Button>
              <Button variant="destructive" onClick={() => onDeleteClicked(site)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Site Details */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-foreground">
                {t("appPage.sites.detail.information")}
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("appPage.sites.page.table.columns.installDate")}
                  </span>
                  <span className="font-medium">
                    {format.dateTime(new Date(site.installedAt), dateOptions)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("common.chargePointWithCount", {
                      count: siteChargePoints.length,
                    })}
                  </span>
                </div>

                {siteChargePoints.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("appPage.sites.detail.reliability.label")}
                    </span>
                    <SiteReliabilityValue siteId={site.id} />
                  </div>
                )}

                <div className="flex justify-end">
                  <SiteReportExportButton site={site} />
                </div>
              </div>
            </section>

            {siteChargePoints.length > 0 && (
              <section className={sectionClass}>
                <SiteChargePointsList
                  chargePoints={siteChargePoints}
                  onViewChargePoint={(chargePointId) =>
                    router.push(`/app/charge-points?id=${chargePointId}`)
                  }
                />
              </section>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Visit History */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-foreground">
                {t("appPage.sites.detail.visits.title")}
              </h2>

              {visitsLoading && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.visits.loading")}
                </span>
              )}

              {!visitsLoading && visitsError && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.visits.loadError")}
                </span>
              )}

              {!visitsLoading && !visitsError && visits.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.visits.empty")}
                </span>
              )}

              {!visitsLoading && !visitsError && visits.length > 0 && (
                <div className="divide-y rounded-md border">
                  {visits.map((visit) => (
                    <div key={visit.id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {format.dateTime(new Date(visit.visitedAt), dateOptions)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(visit.visitedAt)}
                        </span>
                      </div>
                      {visit.note && <span className="text-muted-foreground">{visit.note}</span>}
                    </div>
                  ))}
                </div>
              )}

              {!visitsLoading && !visitsError && (
                <Button variant="outline" onClick={() => setLogVisitOpen(true)}>
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  {t("appPage.sites.detail.visits.logButton")}
                </Button>
              )}

              {/* Next planned visit */}
              <h2 className="text-sm font-semibold text-foreground">
                {t("appPage.sites.detail.nextVisit.title")}
              </h2>

              {scheduleLoading && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.nextVisit.loading")}
                </span>
              )}

              {!scheduleLoading && !schedule && (
                <Button variant="outline" size="sm" onClick={() => setScheduleVisitOpen(true)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {t("appPage.sites.detail.nextVisit.scheduleButton")}
                </Button>
              )}

              {!scheduleLoading && schedule && (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {format.dateTime(new Date(schedule.nextVisitAt), dateOptions)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(schedule.nextVisitAt)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setScheduleVisitOpen(true)}
                      aria-label={t("appPage.sites.detail.nextVisit.editButton")}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelNextVisit}
                      disabled={isCanceling}
                      aria-label={t("appPage.sites.detail.nextVisit.cancelButton")}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Tariff */}
            <section className={sectionClass}>
              <h2 className="text-sm font-semibold text-foreground">
                {t("appPage.sites.detail.tariff.title")}
              </h2>

              {tariffLoading && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.tariff.loading")}
                </span>
              )}

              {!tariffLoading && tariffError && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.tariff.loadError")}
                </span>
              )}

              {!tariffLoading && !tariffError && !tariff && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.sites.detail.tariff.notConfigured")}
                </span>
              )}

              {!tariffLoading && !tariffError && tariff && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("appPage.sites.detail.tariff.currentLabel")}
                  </span>
                  <span className="font-medium">
                    {format.number(tariff.pricePerKwhCents / 100, {
                      style: "currency",
                      currency: tariff.currency,
                    })}{" "}
                    / kWh
                  </span>
                </div>
              )}

              {!tariffLoading && !tariffError && (
                <Button variant="outline" onClick={() => setTariffDialogOpen(true)}>
                  <Coins className="mr-2 h-4 w-4" />
                  {tariff
                    ? t("appPage.sites.detail.tariff.editButton")
                    : t("appPage.sites.detail.tariff.setButton")}
                </Button>
              )}
            </section>
          </div>
        </div>
      </div>

      <LogSiteVisitDialog
        open={logVisitOpen}
        onOpenChange={setLogVisitOpen}
        onSubmit={handleLogVisit}
        isSubmitting={isRecording}
      />

      <SetSiteTariffDialog
        open={tariffDialogOpen}
        onOpenChange={setTariffDialogOpen}
        initialValues={
          tariff
            ? { currency: tariff.currency, pricePerKwh: tariff.pricePerKwhCents / 100 }
            : undefined
        }
        onSubmit={handleSetTariff}
        isSubmitting={isSavingTariff}
      />

      <ScheduleNextVisitDialog
        open={scheduleVisitOpen}
        onOpenChange={setScheduleVisitOpen}
        initialNextVisitAt={schedule ? new Date(schedule.nextVisitAt) : null}
        onSubmit={handleScheduleNextVisit}
        isSubmitting={isScheduling}
      />
    </>
  );
};
