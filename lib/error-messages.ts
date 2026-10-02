/**
 * Centralized HTTP status to error message key mapping.
 * Use this instead of repeating status-to-message logic across components.
 */

const DEFAULT_ERROR_KEY = "errors.unknown";

const HTTP_STATUS_TO_ERROR_KEY: Record<number, string> = {
  400: "errors.badRequest",
  401: "errors.unauthorized",
  403: "errors.forbidden",
  404: "errors.notFound",
  409: "errors.conflict",
  500: "errors.serverError",
  502: "errors.badGateway",
  503: "errors.serviceUnavailable",
  504: "errors.timeout",
};

/**
 * Get generic error message key for HTTP status.
 * Useful as a fallback when specific error handling is not needed.
 */
export function getHttpErrorMessageKey(httpStatus: number): string {
  return HTTP_STATUS_TO_ERROR_KEY[httpStatus] || DEFAULT_ERROR_KEY;
}

/**
 * Domain-specific error message key mappers.
 * Each domain (reset, availability, unlock) can have custom handling for specific statuses.
 */

export function getResetErrorMessageKey(httpStatus: number): string {
  const resetSpecificMessages: Record<number, string> = {
    404: "appPage.chargePoints.reset.result.notFound",
    409: "appPage.chargePoints.reset.result.notConnectedOrRejected",
    502: "appPage.chargePoints.reset.result.stationError",
    504: "appPage.chargePoints.reset.result.timeout",
  };
  return resetSpecificMessages[httpStatus] || "appPage.chargePoints.reset.result.genericError";
}

export function getAvailabilityErrorMessageKey(httpStatus: number): string {
  const availabilitySpecificMessages: Record<number, string> = {
    404: "appPage.chargePoints.availability.result.notFound",
    409: "appPage.chargePoints.availability.result.notConnectedOrRejected",
    502: "appPage.chargePoints.availability.result.stationError",
    504: "appPage.chargePoints.availability.result.timeout",
  };
  return (
    availabilitySpecificMessages[httpStatus] ||
    "appPage.chargePoints.availability.result.genericError"
  );
}

export function getUnlockConnectorErrorMessageKey(httpStatus: number): string {
  const unlockSpecificMessages: Record<number, string> = {
    404: "appPage.chargePoints.unlockConnector.result.notFound",
    409: "appPage.chargePoints.unlockConnector.result.notConnectedOrFailed",
    502: "appPage.chargePoints.unlockConnector.result.stationError",
    504: "appPage.chargePoints.unlockConnector.result.timeout",
  };
  return (
    unlockSpecificMessages[httpStatus] || "appPage.chargePoints.unlockConnector.result.genericError"
  );
}

/** `POST /api/firmware-campaigns` (400: bad targetMode input/past scheduledAt/
 * negative staggerMs/empty resolved target set — the zod schema in
 * `CreateFirmwareCampaignDialog` catches almost all of these first; 404: an
 * unknown/out-of-scope `targetSiteId`). */
export function getFirmwareCampaignCreateErrorMessageKey(httpStatus: number): string {
  const createSpecificMessages: Record<number, string> = {
    400: "appPage.firmwareCampaigns.errors.invalidRequest",
    404: "appPage.firmwareCampaigns.errors.siteNotFound",
  };
  return createSpecificMessages[httpStatus] || "appPage.firmwareCampaigns.errors.genericError";
}

/** `DELETE /api/firmware-campaigns/:id` (404: unknown id; 409: already past
 * `SCHEDULED`). */
export function getFirmwareCampaignCancelErrorMessageKey(httpStatus: number): string {
  const cancelSpecificMessages: Record<number, string> = {
    404: "appPage.firmwareCampaigns.errors.notFound",
    409: "appPage.firmwareCampaigns.errors.alreadyDispatching",
  };
  return cancelSpecificMessages[httpStatus] || "appPage.firmwareCampaigns.errors.genericError";
}

/** `POST /api/charge-points/:id/certificates` (404: unknown charge point;
 * 409: station offline, OR the requested `certificateType` isn't supported
 * by this station's dialect / the certificate is too long for 2.0.1's
 * 5500-char bound — the backend distinguishes those by message text only,
 * so both collapse to one message here, same as this codebase's other
 * write-command 409s). */
export function getCertificateInstallErrorMessageKey(httpStatus: number): string {
  const installSpecificMessages: Record<number, string> = {
    404: "appPage.chargePoints.certificates.install.result.notFound",
    409: "appPage.chargePoints.certificates.install.result.notConnectedOrUnsupported",
    502: "appPage.chargePoints.certificates.install.result.stationError",
    504: "appPage.chargePoints.certificates.install.result.timeout",
  };
  return (
    installSpecificMessages[httpStatus] ||
    "appPage.chargePoints.certificates.install.result.genericError"
  );
}

/** `DELETE /api/charge-points/:id/certificates` (404: unknown charge point;
 * 409: station offline). */
export function getCertificateDeleteErrorMessageKey(httpStatus: number): string {
  const deleteSpecificMessages: Record<number, string> = {
    404: "appPage.chargePoints.certificates.delete.result.notFound",
    409: "appPage.chargePoints.certificates.delete.result.notConnected",
    502: "appPage.chargePoints.certificates.delete.result.stationError",
    504: "appPage.chargePoints.certificates.delete.result.timeout",
  };
  return (
    deleteSpecificMessages[httpStatus] ||
    "appPage.chargePoints.certificates.delete.result.genericError"
  );
}
