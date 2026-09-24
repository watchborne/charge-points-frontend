import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ dateTime: (date: Date) => date.toISOString() }),
}));

// `vi.hoisted` because vi.mock factories are hoisted above these
// declarations — the repo's existing pattern (see SiteReliabilityValue.test.tsx).
const { useSiteReportMock, pdfMock, toBlobMock } = vi.hoisted(() => ({
  useSiteReportMock: vi.fn(),
  toBlobMock: vi.fn(),
  pdfMock: vi.fn(),
}));

vi.mock("../../../hooks/useSiteReport", () => ({ useSiteReport: useSiteReportMock }));

// The chart capture step is a real off-screen render + html2canvas
// rasterization — out of scope for this test (per the issue's own testing
// note: verify generation triggers with the assembled data, not pixel
// output). Its `onCaptured` contract is exercised here via a fake that
// fires it immediately with no images, same as "no charge point had
// anything chartable".
vi.mock("../SiteReportChartCapture", () => ({
  SiteReportChartCapture: ({
    onCaptured,
  }: {
    onCaptured: (images: Record<string, string>) => void;
  }) => {
    useEffect(() => {
      onCaptured({});
    }, [onCaptured]);
    return null;
  },
}));

// `StyleSheet.create` runs at `SiteReportDocument`'s module top level, so
// even though `pdf(...)` below never actually renders the element it's
// given, importing that module still needs a working stub. `Document`/
// `Page`/etc. are never invoked in this test: React elements are just data
// until something renders them, and `pdf` is mocked to ignore its argument.
vi.mock("@react-pdf/renderer", () => ({
  pdf: pdfMock,
  Document: () => null,
  Page: () => null,
  View: () => null,
  Text: () => null,
  Image: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
}));

import { SiteReportExportButton } from "../SiteReportExportButton";

afterEach(() => cleanup());

const SITE = { id: "site-1", name: "Test Site", customer: "Acme" } as unknown as Site;

// Untyped: `useSiteReport` is fully mocked below, so the fixture only needs
// to structurally match what `SiteReportExportButton` reads from it.
const REPORT = {
  siteId: "site-1",
  from: "2026-08-01T00:00:00.000Z",
  to: "2026-08-08T00:00:00.000Z",
  uptime: {
    siteId: "site-1",
    from: "2026-08-01T00:00:00.000Z",
    to: "2026-08-08T00:00:00.000Z",
    onlineMs: 500_000,
    totalMs: 600_000,
    lastActivity: null,
    chargePoints: [],
  },
  chargePoints: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  pdfMock.mockReturnValue({ toBlob: toBlobMock });
  toBlobMock.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
  useSiteReportMock.mockReturnValue({ report: REPORT, loading: false, failed: false });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

describe("SiteReportExportButton", () => {
  it("SHOULD disable the export button WHILE the report is loading", () => {
    useSiteReportMock.mockReturnValue({ report: null, loading: true, failed: false });

    render(<SiteReportExportButton site={SITE} chargePoints={[]} />);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("SHOULD disable the export button WHEN the report failed to load", () => {
    useSiteReportMock.mockReturnValue({ report: null, loading: false, failed: true });

    render(<SiteReportExportButton site={SITE} chargePoints={[]} />);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("SHOULD generate and download a PDF WHEN clicked", async () => {
    render(<SiteReportExportButton site={SITE} chargePoints={[]} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(toBlobMock).toHaveBeenCalled());
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    await waitFor(() =>
      expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false),
    );
  });

  it("SHOULD show an error message WHEN PDF generation fails", async () => {
    toBlobMock.mockRejectedValueOnce(new Error("boom"));

    render(<SiteReportExportButton site={SITE} chargePoints={[]} />);

    fireEvent.click(screen.getByRole("button"));

    expect(await screen.findByText("appPage.sites.detail.report.exportError")).toBeTruthy();
  });
});
