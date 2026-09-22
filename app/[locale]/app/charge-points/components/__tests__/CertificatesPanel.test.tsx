import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these declarations —
// the repo's existing pattern (see LogUploadPanel.test.tsx).
const { listCertificates, installCertificate, deleteCertificate } = vi.hoisted(() => ({
  listCertificates: vi.fn(),
  installCertificate: vi.fn(),
  deleteCertificate: vi.fn(),
}));

// Mocked via the relative module path, not the "@/lib/api" alias: this project's
// Vitest config does not alias "@/" for the mock resolver, so an aliased target
// silently fails to intercept and the real fetch runs. Repo convention — see
// LogUploadPanel.test.tsx.
vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { listCertificates, installCertificate, deleteCertificate } },
}));

import { CertificatesPanel } from "../CertificatesPanel";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";

let queryClient: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  listCertificates.mockResolvedValue({ status: "Accepted", certificates: [] });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

const renderPanel = (ocppVersion: "1.6" | "2.0.1" = "2.0.1") =>
  render(
    <QueryClientProvider client={queryClient}>
      <CertificatesPanel chargePointId={CP_ID} ocppVersion={ocppVersion} />
    </QueryClientProvider>,
  );

describe("CertificatesPanel", () => {
  it("SHOULD show a loading state WHILE fetching", () => {
    renderPanel();

    expect(screen.getByText("appPage.chargePoints.certificates.loading")).toBeTruthy();
  });

  it("SHOULD say so WHEN there are no certificates installed", async () => {
    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.certificates.empty")).toBeTruthy();
  });

  it("SHOULD surface a load failure rather than rendering an empty panel", async () => {
    listCertificates.mockRejectedValue(new Error("boom"));

    renderPanel();

    expect(await screen.findByText("appPage.chargePoints.certificates.loadError")).toBeTruthy();
  });

  it("SHOULD render each installed certificate's type, algorithm and serial number", async () => {
    listCertificates.mockResolvedValue({
      status: "Accepted",
      certificates: [
        {
          certificateHashData: {
            hashAlgorithm: "SHA256",
            issuerNameHash: "issuer",
            issuerKeyHash: "key",
            serialNumber: "SN-001",
          },
          certificateType: "CSMSRootCertificate",
        },
      ],
    });

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.certificates.types.CSMSRootCertificate"),
    ).toBeTruthy();
    expect(screen.getByText(/SHA256/)).toBeTruthy();
    expect(screen.getByText(/SN-001/)).toBeTruthy();
  });

  it("SHOULD show a fallback label WHEN a certificate has no reported type", async () => {
    listCertificates.mockResolvedValue({
      status: "Accepted",
      certificates: [
        {
          certificateHashData: {
            hashAlgorithm: "SHA256",
            issuerNameHash: "issuer",
            issuerKeyHash: "key",
            serialNumber: "SN-002",
          },
        },
      ],
    });

    renderPanel();

    expect(
      await screen.findByText("appPage.chargePoints.certificates.typeNotReported"),
    ).toBeTruthy();
  });

  it("SHOULD refetch WHEN a different charge point is opened", async () => {
    const { rerender } = renderPanel();
    await waitFor(() => expect(listCertificates).toHaveBeenCalledWith("cp-1"));

    rerender(
      <QueryClientProvider client={queryClient}>
        <CertificatesPanel chargePointId="cp-2" ocppVersion="2.0.1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(listCertificates).toHaveBeenCalledWith("cp-2"));
  });
});
