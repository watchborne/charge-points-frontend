"use client";

import { pdf } from "@react-pdf/renderer";
import type { Site } from "@watchborne/charge-points-types";
import { Button } from "@watchborne/electrons";
import { FileDown, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import type { ChargePointWithConnectors } from "@/types/charge-point";

import { SiteReportChartCapture } from "./SiteReportChartCapture";
import { SiteReportDocument } from "./SiteReportDocument";
import { useSiteReport } from "../../hooks/useSiteReport";

type Props = {
  site: Site;
  chargePoints: ChargePointWithConnectors[];
};

type Phase = "idle" | "capturing" | "generating";

const DAY_MS = 24 * 60 * 60 * 1000;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Exports the site's printable report (issue charge-points-server#532) as a
 * PDF: assembles the data (`useSiteReport`), rasterizes each charge point's
 * consumption chart off-screen (`SiteReportChartCapture` — `@react-pdf/renderer`
 * can't render `recharts`' live DOM output directly), then renders
 * `SiteReportDocument` to a blob and triggers a browser download.
 *
 * `SiteReportChartCapture` is only mounted while `phase === "capturing"` —
 * it has nothing left to do once it reports back, so it never stays parked
 * in the tree.
 */
export const SiteReportExportButton = ({ site, chargePoints }: Props) => {
  const t = useTranslations("");
  const format = useFormatter();
  const { report, loading, failed } = useSiteReport(site, chargePoints);
  const [phase, setPhase] = useState<Phase>("idle");
  const [exportFailed, setExportFailed] = useState(false);

  const handleCaptured = useCallback(
    async (chartImages: Record<string, string>) => {
      if (!report) {
        setPhase("idle");
        return;
      }

      setPhase("generating");
      try {
        const blob = await pdf(
          <SiteReportDocument
            site={site}
            report={report}
            chartImages={chartImages}
            t={t}
            format={format}
          />,
        ).toBlob();

        downloadBlob(blob, `${site.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.pdf`);
      } catch {
        setExportFailed(true);
      } finally {
        setPhase("idle");
      }
    },
    [report, site, t, format],
  );

  const handleExport = () => {
    setExportFailed(false);
    setPhase("capturing");
  };

  const spansDays = report
    ? new Date(report.to).getTime() - new Date(report.from).getTime() > DAY_MS
    : true;

  return (
    <>
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={loading || failed || phase !== "idle"}
      >
        {phase === "idle" ? (
          <FileDown className="h-4 w-4 mr-2" />
        ) : (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        )}
        {t("appPage.sites.detail.report.exportButton")}
      </Button>

      {exportFailed && (
        <p className="text-xs text-destructive">{t("appPage.sites.detail.report.exportError")}</p>
      )}

      {phase === "capturing" && report && (
        <SiteReportChartCapture
          chargePoints={report.chargePoints}
          spansDays={spansDays}
          onCaptured={handleCaptured}
        />
      )}
    </>
  );
};
