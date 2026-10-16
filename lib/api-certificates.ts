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
 * Same discriminated-result shape as `ResetChargePointOutcome`, for the same
 * reason: InstallCertificate is a request/response OCPP command whose caller
 * needs the specific outcome (accepted/rejected/failed vs. offline/
 * unsupported-type-or-too-long/timeout). Unlike the reset/availability
 * commands, `ok: true` covers all three station verdicts — the station
 * always answers with a status, never an empty acknowledgment.
 */
export type InstallCertificateOutcome = CommandOutcome<{
  status: InstallCertificateStatus;
  statusInfo?: string;
}>;

/**
 * Same discriminated-result shape as `InstallCertificateOutcome`, for the
 * same reason: DeleteCertificate is a request/response OCPP command whose
 * caller needs the specific outcome (accepted/failed/not-found vs. offline/
 * timeout).
 */
export type DeleteCertificateOutcome = CommandOutcome<{
  status: DeleteCertificateStatus;
  statusInfo?: string;
}>;

export const certificateApis = {
  /**
   * The charge point's installed OCPP trust-anchor certificates (OCPP
   * `GetInstalledCertificateIds`). A plain read — like `getFirmware`, this
   * goes through `httpClient`, since a failure just needs to surface as a
   * thrown error for `useQuery` to catch, with no per-code UX to branch on.
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
   * Deletes an installed certificate (OCPP `DeleteCertificate`), identified
   * by its hash data rather than an id. `httpClient.delete` has no body
   * parameter, so this uses raw `fetch` like the other write commands above.
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
