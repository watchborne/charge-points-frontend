import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Site } from "@watchborne/charge-points-types";
import type { useFormatter, useTranslations } from "next-intl";

import { consumptionHeadline } from "../../charge-points/components/ConsumptionTile";
import type { SiteReport } from "../../hooks/useSiteReport";

/** next-intl's own translator/formatter types — narrower than a hand-rolled
 * shape would be (see `ConsumptionTile.tsx`'s identical `Translate` note). */
type Translate = ReturnType<typeof useTranslations>;
type Format = ReturnType<typeof useFormatter>;

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  title: { fontSize: 18, marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#6b7280", marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #e5e7eb",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#6b7280" },
  value: { fontWeight: 700 },
  chargePointBlock: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1px solid #f3f4f6",
  },
  chargePointName: { fontSize: 13, marginBottom: 8, fontWeight: 700 },
  chartImage: { width: "100%", height: 160, marginTop: 6, marginBottom: 8 },
  alertsLabel: { fontSize: 9, color: "#6b7280", marginTop: 4, marginBottom: 3 },
  alertRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9, marginBottom: 2 },
  noAlerts: { fontSize: 9, color: "#9ca3af" },
});

type Props = {
  site: Site;
  report: SiteReport;
  /** PNGs keyed by `chargePointId`, from `SiteReportChartCapture` — absent for a charge point with nothing charted. */
  chartImages: Record<string, string>;
  t: Translate;
  format: Format;
};

const formatDate = (format: Format, at: Date | string) =>
  format.dateTime(new Date(at), { year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * The printable site report (issue charge-points-server#532): site
 * identity and window, aggregated uptime, then per charge point its
 * charted consumption headline(s), the chart image `SiteReportChartCapture`
 * rasterized, and the alerts opened during the window.
 *
 * Pure `@react-pdf/renderer` primitives, not the dashboard's own JSX — this
 * renders through react-pdf's own layout engine to a PDF document, so it
 * can't reuse `ConsumptionTile`'s markup (only its headline-figure logic,
 * `consumptionHeadline`) or render `ConsumptionChart` directly (only its
 * already-rasterized `chartImages` output).
 */
export const SiteReportDocument = ({ site, report, chartImages, t, format }: Props) => {
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  const uptimePercent =
    report.uptime.totalMs > 0
      ? Math.round((report.uptime.onlineMs / report.uptime.totalMs) * 100)
      : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{site.name}</Text>
        <Text style={styles.subtitle}>
          {site.customer} — {formatDate(format, report.from)} → {formatDate(format, report.to)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("appPage.sites.detail.report.pdf.uptimeSection")}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t("appPage.sites.detail.reliability.label")}</Text>
            <Text style={styles.value}>{uptimePercent !== null ? `${uptimePercent}%` : "—"}</Text>
          </View>
        </View>

        {report.chargePoints.map((chargePoint) => {
          const chartedSeries = chargePoint.chartMeasurand
            ? chargePoint.consumption.series.filter(
                (series) =>
                  series.measurand === chargePoint.chartMeasurand &&
                  chargePoint.chartConnectorIds.includes(series.connectorId),
              )
            : [];

          return (
            <View key={chargePoint.chargePointId} style={styles.chargePointBlock}>
              <Text style={styles.chargePointName}>{chargePoint.name}</Text>

              {chartedSeries.map((series) => {
                const headline = consumptionHeadline(series, t, formatNumber);
                return (
                  <View key={series.connectorId} style={styles.row}>
                    <Text style={styles.label}>
                      {t("appPage.chargePoints.detail.connector", {
                        connectorId: series.connectorId,
                      })}{" "}
                      — {headline.title}
                    </Text>
                    <Text style={styles.value}>{headline.value}</Text>
                  </View>
                );
              })}

              {chartImages[chargePoint.chargePointId] && (
                // react-pdf's own `Image` primitive (PDF layout, not an <img> —
                // jsx-a11y's alt-text check doesn't apply to it).
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image style={styles.chartImage} src={chartImages[chargePoint.chargePointId]} />
              )}

              <Text style={styles.alertsLabel}>
                {t("appPage.sites.detail.report.pdf.alertsSection")}
              </Text>
              {chargePoint.alerts.length === 0 ? (
                <Text style={styles.noAlerts}>{t("appPage.sites.detail.report.pdf.noAlerts")}</Text>
              ) : (
                chargePoint.alerts.map((alert) => (
                  <View key={alert.id} style={styles.alertRow}>
                    <Text>{alert.type}</Text>
                    <Text>{formatDate(format, alert.openedAt)}</Text>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};
