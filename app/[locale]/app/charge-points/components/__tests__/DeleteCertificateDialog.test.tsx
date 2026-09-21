import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` + the *relative* module path (not the "@/lib/api" alias): this
// project's Vitest config does not alias "@/" for the mock resolver, so an
// aliased target silently fails to intercept and the real fetch runs.
const { deleteCertificate } = vi.hoisted(() => ({ deleteCertificate: vi.fn() }));

vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { deleteCertificate } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { DeleteCertificateDialog } from "../DeleteCertificateDialog";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";
const CERTIFICATE_HASH_DATA = {
  hashAlgorithm: "SHA256" as const,
  issuerNameHash: "issuer",
  issuerKeyHash: "key",
  serialNumber: "SN-001",
};

const onDeleted = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  deleteCertificate.mockResolvedValue({ ok: true, status: "Accepted" });
});

const renderDialog = () =>
  render(
    <DeleteCertificateDialog
      chargePointId={CP_ID}
      certificateHashData={CERTIFICATE_HASH_DATA}
      onDeleted={onDeleted}
    />,
  );

const openDialog = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.certificates.row.delete"));
};

const confirm = () => {
  fireEvent.click(screen.getByText("common.delete"));
};

describe("DeleteCertificateDialog", () => {
  it("SHOULD ask for confirmation before deleting", () => {
    renderDialog();
    openDialog();

    expect(screen.getByText("appPage.chargePoints.certificates.delete.confirmTitle")).toBeTruthy();
    expect(deleteCertificate).not.toHaveBeenCalled();
  });

  it("SHOULD call deleteCertificate with the certificate's hash data on confirm", async () => {
    renderDialog();
    openDialog();
    confirm();

    await waitFor(() =>
      expect(deleteCertificate).toHaveBeenCalledWith(CP_ID, CERTIFICATE_HASH_DATA),
    );
  });

  it("SHOULD report the station's acceptance and call onDeleted", async () => {
    renderDialog();
    openDialog();
    confirm();

    expect(
      await screen.findByText("appPage.chargePoints.certificates.delete.result.accepted"),
    ).toBeTruthy();
    expect(onDeleted).toHaveBeenCalled();
  });

  it("SHOULD report the station's failure without calling onDeleted", async () => {
    deleteCertificate.mockResolvedValue({ ok: true, status: "Failed" });

    renderDialog();
    openDialog();
    confirm();

    expect(
      await screen.findByText("appPage.chargePoints.certificates.delete.result.failed"),
    ).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it.each([
    [404, "notFound"],
    [409, "notConnected"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message", async (httpStatus, key) => {
    deleteCertificate.mockResolvedValue({ ok: false, httpStatus });

    renderDialog();
    openDialog();
    confirm();

    expect(
      await screen.findByText(`appPage.chargePoints.certificates.delete.result.${key}`),
    ).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
