"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@watchborne/electrons";
import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { DeleteCertificateDialog } from "./DeleteCertificateDialog";
import { InstallCertificateDialog } from "./InstallCertificateDialog";

type CertificatesPanelProps = {
  chargePointId: ChargePoint["id"];
  /** Gates the 2.0.1-only certificate types in the install dialog. */
  ocppVersion: ChargePoint["ocppVersion"];
};

/**
 * The trust-anchor-certificate section of a charge point's detail panel:
 * what's installed (OCPP `GetInstalledCertificateIds`), and lets an
 * installer add or remove one — the `LogUploadPanel` equivalent for
 * `InstallCertificate`/`DeleteCertificate`/`GetInstalledCertificateIds`
 * (issue #535). Applies to both OCPP dialects, unlike the 2.0.1-only panels
 * around it in the security tab.
 *
 * Fetch-once and self-contained: like `LogUploadPanel`, there is no
 * dedicated WebSocket broadcast for this yet, so this does not subscribe to
 * the dashboard socket — `reload()` is a plain refetch after a write.
 */
export const CertificatesPanel = ({ chargePointId, ocppVersion }: CertificatesPanelProps) => {
  const t = useTranslations("");

  const {
    data,
    isLoading: loading,
    isError: failed,
    refetch,
  } = useQuery({
    queryKey: queryKeys.certificates.chargePoint(chargePointId),
    queryFn: () => api.ChargePoints.listCertificates(chargePointId),
  });

  const reload = () => void refetch();

  const certificates = data?.certificates ?? [];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.certificates.title")}
        </span>
        <InstallCertificateDialog
          chargePointId={chargePointId}
          ocppVersion={ocppVersion}
          onInstalled={reload}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("appPage.chargePoints.certificates.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.certificates.loadError")} variant="error" />
      )}

      {!loading && !failed && certificates.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.certificates.empty")}
        </span>
      )}

      {!loading && !failed && certificates.length > 0 && (
        <div className="divide-y rounded-md border">
          {certificates.map((certificate, index) => (
            <div
              // A certificate has no stable id of its own; the hash fields together
              // with the array position are as stable a key as this list can offer
              // between refetches.
              key={`${certificate.certificateHashData.serialNumber}-${index}`}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {certificate.certificateType
                    ? t(`appPage.chargePoints.certificates.types.${certificate.certificateType}`)
                    : t("appPage.chargePoints.certificates.typeNotReported")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {certificate.certificateHashData.hashAlgorithm} ·{" "}
                  <span className="font-mono">{certificate.certificateHashData.serialNumber}</span>
                </span>
              </div>

              <DeleteCertificateDialog
                chargePointId={chargePointId}
                certificateHashData={certificate.certificateHashData}
                onDeleted={reload}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
