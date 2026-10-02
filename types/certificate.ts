export {
  GET_CERTIFICATE_ID_USE_TYPES_V201,
  INSTALL_CERTIFICATE_USE_TYPES_V201,
  type CertificateHashData,
  type DeleteCertificateStatus,
  type GetCertificateIdUseV201,
  type GetInstalledCertificateStatus,
  type InstallCertificateStatus,
  type InstallCertificateUseV201,
  GetCertificateIdUseV201Schema,
  InstallCertificateUseV201Schema,
} from "@watchborne/charge-points-types";

import type {
  CertificateHashData,
  GetCertificateIdUseV201,
  GetInstalledCertificateStatus,
} from "@watchborne/charge-points-types";

/**
 * What `POST /api/charge-points/:id/certificates/query` answers — the
 * backend's `certificates` list, unaltered, plus the outcome status. Kept as
 * its own local type, like `ChargePointLogUpload`, since it's the response
 * shape rather than a domain entity `@watchborne/charge-points-types` owns.
 */
export type ChargePointCertificates = {
  status: GetInstalledCertificateStatus;
  certificates: Array<{
    certificateHashData: CertificateHashData;
    /**
     * Absent for an OCPP 1.6 station: its `GetInstalledCertificateIds`
     * response reports only the hash data, with no per-certificate type.
     */
    certificateType?: GetCertificateIdUseV201;
  }>;
};
