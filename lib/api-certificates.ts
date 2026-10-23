import type {
  ChargePoint,
  DeleteCertificateStatus,
  InstallCertificateStatus,
  InstallCertificateUseV201,
} from "@watchborne/charge-points-types";

import type {
  CertificateHashData,
  ChargePointCertificates,
  GetCertificateIdUseV201,
} from "@/types/certificate";

import { withErrorLogging, withErrorLoggingAsync } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";

/** What an installer fills in to install a trust-anchor certificate. */
export type InstallCertificateBody = {
  certificateType: InstallCertificateUseV201;
  /** PEM-encoded X.509 certificate. */
  certificate: string;
};

/**
 * `ok: true` covers all three station verdicts (accepted/rejected/failed);
 * failures are offline, unsupported type or too long, timeout.
 */
export type InstallCertificateOutcome = CommandOutcome<{
  status: InstallCertificateStatus;
  statusInfo?: string;
}>;

/** The station's verdict: accepted, failed or not found. */
export type DeleteCertificateOutcome = CommandOutcome<{
  status: DeleteCertificateStatus;
  statusInfo?: string;
}>;

export const certificateApis = {
  /**
   * The installed trust-anchor certificates (`GetInstalledCertificateIds`).
   * A plain read through `httpClient`: a failure only needs to throw.
   */
  listCertificates: async function (
    chargePointId: ChargePoint["id"],
    certificateType?: GetCertificateIdUseV201[],
  ): Promise<ChargePointCertificates> {
    return withErrorLogging(
      () =>
        httpClient.post<ChargePointCertificates>(
          `/api/charge-points/${chargePointId}/certificates/query`,
          certificateType ? { certificateType } : {},
        ),
      "ChargePoint.listCertificates",
    );
  },
  /** Installs a trust-anchor certificate (OCPP `InstallCertificate`). */
  installCertificate: async function (
    chargePointId: ChargePoint["id"],
    body: InstallCertificateBody,
  ): Promise<InstallCertificateOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/certificates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        const { status, statusInfo } = (await response.json()) as {
          status: InstallCertificateStatus;
          statusInfo?: string;
        };
        return { ok: true, status, statusInfo };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.installCertificate");
  },
  /**
   * Deletes a certificate by its hash data (`DeleteCertificate`). Raw `fetch`:
   * `httpClient.delete` takes no body.
   */
  deleteCertificate: async function (
    chargePointId: ChargePoint["id"],
    certificateHashData: CertificateHashData,
  ): Promise<DeleteCertificateOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/certificates`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateHashData }),
        },
      );

      if (response.ok) {
        const { status, statusInfo } = (await response.json()) as {
          status: DeleteCertificateStatus;
          statusInfo?: string;
        };
        return { ok: true, status, statusInfo };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.deleteCertificate");
  },
};
