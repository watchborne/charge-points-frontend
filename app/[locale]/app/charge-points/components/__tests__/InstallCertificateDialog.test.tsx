import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` + the *relative* module path (not the "@/lib/api" alias): this
// project's Vitest config does not alias "@/" for the mock resolver, so an
// aliased target silently fails to intercept and the real fetch runs.
const { installCertificate } = vi.hoisted(() => ({ installCertificate: vi.fn() }));

vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { installCertificate } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { InstallCertificateDialog } from "../InstallCertificateDialog";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";
const CERTIFICATE = "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----";

const onInstalled = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  installCertificate.mockResolvedValue({ ok: true, status: "Accepted" });
});

const renderDialog = (ocppVersion: "1.6" | "2.0.1" = "2.0.1") =>
  render(
    <InstallCertificateDialog
      chargePointId={CP_ID}
      ocppVersion={ocppVersion}
      onInstalled={onInstalled}
    />,
  );

const openDialog = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.certificates.install.button"));
};

const fillCertificate = (value: string) => {
  fireEvent.change(
    screen.getByLabelText("appPage.chargePoints.certificates.install.fields.certificate"),
    { target: { value } },
  );
};

const submit = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.certificates.install.submit"));
};

const openTypeSelect = () => {
  fireEvent.pointerDown(screen.getByRole("combobox"), {
    button: 0,
    ctrlKey: false,
    pointerType: "mouse",
  });
};

describe("InstallCertificateDialog", () => {
  it("SHOULD refuse to submit an empty certificate", () => {
    renderDialog();
    openDialog();

    const button = screen
      .getByText("appPage.chargePoints.certificates.install.submit")
      .closest("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD install with the default certificate type and filled-in PEM", async () => {
    renderDialog();
    openDialog();
    fillCertificate(CERTIFICATE);
    submit();

    await waitFor(() => expect(installCertificate).toHaveBeenCalledTimes(1));
    const [chargePointId, body] = installCertificate.mock.calls[0];
    expect(chargePointId).toBe(CP_ID);
    expect(body.certificate).toBe(CERTIFICATE);
    expect(body.certificateType).toBe("CSMSRootCertificate");
  });

  it("SHOULD offer the V2G/MO options to an OCPP 2.0.1 station", () => {
    renderDialog("2.0.1");
    openDialog();
    openTypeSelect();

    expect(
      screen.getByText("appPage.chargePoints.certificates.types.V2GRootCertificate"),
    ).toBeTruthy();
    expect(
      screen.getByText("appPage.chargePoints.certificates.types.MORootCertificate"),
    ).toBeTruthy();
    expect(
      screen.queryByText("appPage.chargePoints.certificates.install.unsupportedV201Types"),
    ).toBeNull();
  });

  it("SHOULD hide the V2G/MO options for an OCPP 1.6 station and explain why", () => {
    renderDialog("1.6");
    openDialog();
    openTypeSelect();

    expect(
      screen.queryByText("appPage.chargePoints.certificates.types.V2GRootCertificate"),
    ).toBeNull();
    expect(
      screen.queryByText("appPage.chargePoints.certificates.types.MORootCertificate"),
    ).toBeNull();
    expect(
      screen.getByText("appPage.chargePoints.certificates.install.unsupportedV201Types"),
    ).toBeTruthy();
  });

  it("SHOULD warn WHEN the pasted text doesn't look like a PEM certificate", () => {
    renderDialog();
    openDialog();
    fillCertificate("not a certificate");

    expect(
      screen.getByText("appPage.chargePoints.certificates.install.fields.certificateLooksInvalid"),
    ).toBeTruthy();
  });

  it("SHOULD report the station's acceptance", async () => {
    renderDialog();
    openDialog();
    fillCertificate(CERTIFICATE);
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.certificates.install.result.accepted"),
    ).toBeTruthy();
    expect(onInstalled).toHaveBeenCalled();
  });

  it("SHOULD report the station's rejection without calling onInstalled", async () => {
    installCertificate.mockResolvedValue({ ok: true, status: "Rejected" });

    renderDialog();
    openDialog();
    fillCertificate(CERTIFICATE);
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.certificates.install.result.rejected"),
    ).toBeTruthy();
    expect(onInstalled).not.toHaveBeenCalled();
  });

  it.each([
    [404, "notFound"],
    [409, "notConnectedOrUnsupported"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message", async (httpStatus, key) => {
    installCertificate.mockResolvedValue({ ok: false, httpStatus });

    renderDialog();
    openDialog();
    fillCertificate(CERTIFICATE);
    submit();

    expect(
      await screen.findByText(`appPage.chargePoints.certificates.install.result.${key}`),
    ).toBeTruthy();
    expect(onInstalled).not.toHaveBeenCalled();
  });
});
