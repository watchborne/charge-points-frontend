"use client";

import { Button } from "@watchborne/electrons";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { downloadCsv, type CsvCell } from "@/lib/csv";

type Props = {
  /** Builds the file on click, from data the panel already holds — no request. */
  getRows: () => CsvCell[][];
  filename: string;
  disabled?: boolean;
};

/** Icon button exporting a panel's already-fetched data as a CSV download. */
export const CsvExportButton = ({ getRows, filename, disabled }: Props) => {
  const t = useTranslations("");

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => downloadCsv(filename, getRows())}
      aria-label={t("common.exportCsv")}
      title={t("common.exportCsv")}
    >
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
};
