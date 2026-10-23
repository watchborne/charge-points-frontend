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
 * `POST /api/charge-points/:id/certificates/query`'s answer: the station's
 * certificates and the outcome status. A local response type.
 */
export type ChargePointCertificates = {
  status: GetInstalledCertificateStatus;
  certificates: Array<{
    certificateHashData: CertificateHashData;
    /** Absent on 1.6: it reports only the hash data. */
    certificateType?: GetCertificateIdUseV201;
  }>;
};
