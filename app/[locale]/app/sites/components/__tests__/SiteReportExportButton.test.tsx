import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { localeMock } = vi.hoisted(() => ({ localeMock: { current: "fr" } }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => localeMock.current,
}));

// `vi.hoisted` because vi.mock factories are hoisted above these
// declarations — the repo's existing pattern (see SiteReliabilityValue.test.tsx).
const { downloadReportMock } = vi.hoisted(() => ({ downloadReportMock: vi.fn() }));

// Mocked via the relative module path, not the "@/lib/api" alias — this
// project's Vitest config does not alias "@/" for the mock resolver (see
// useFleetReliability.test.ts's identical note).
vi.mock("../../../../../../lib/api", () => ({
  api: { Sites: { downloadReport: downloadReportMock } },
}));

import { SiteReportExportButton } from "../SiteReportExportButton";

afterEach(() => cleanup());

const SITE = { id: "site-1", name: "Site Nord — Été", customer: "Acme" } as unknown as Site;

let clickedLink: { download: string; href: string } | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  localeMock.current = "fr";
  clickedLink = undefined;
  downloadReportMock.mockResolvedValue({
    blob: new Blob(["pdf"], { type: "application/pdf" }),
    filename: "site-nord-ete-report.pdf",
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clickedLink = { download: this.download, href: this.href };
  });
});

const button = () => screen.getByRole("button") as HTMLButtonElement;

describe("SiteReportExportButton", () => {
  it("SHOULD ask the backend for the site's report in the page's language WHEN clicked", async () => {
    localeMock.current = "en";
    render(<SiteReportExportButton site={SITE} />);

    fireEvent.click(button());

    await waitFor(() => expect(downloadReportMock).toHaveBeenCalledTimes(1));
    expect(downloadReportMock).toHaveBeenCalledWith("site-1", { locale: "en" });
  });

  it("SHOULD hand the file to the browser under the server's filename", async () => {
    render(<SiteReportExportButton site={SITE} />);

    fireEvent.click(button());

    await waitFor(() => expect(clickedLink).toBeDefined());
    expect(clickedLink?.download).toBe("site-nord-ete-report.pdf");
    expect(clickedLink?.href).toBe("blob:mock-url");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("SHOULD fall back to a name derived from the site WHEN the server sent none", async () => {
    downloadReportMock.mockResolvedValue({ blob: new Blob(["pdf"]), filename: undefined });
    render(<SiteReportExportButton site={SITE} />);

    fireEvent.click(button());

    await waitFor(() => expect(clickedLink).toBeDefined());
    expect(clickedLink?.download).toBe("site-nord-ete-report.pdf");
  });

  it("SHOULD disable the button WHILE the report is being generated", async () => {
    let finish: (value: unknown) => void = () => {};
    downloadReportMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SiteReportExportButton site={SITE} />);

    fireEvent.click(button());

    await waitFor(() => expect(button().disabled).toBe(true));
    finish({ blob: new Blob(["pdf"]), filename: "r.pdf" });
    await waitFor(() => expect(button().disabled).toBe(false));
  });

  it("SHOULD show an error and re-enable the button WHEN the download fails", async () => {
    downloadReportMock.mockRejectedValueOnce(new Error("boom"));
    render(<SiteReportExportButton site={SITE} />);

    fireEvent.click(button());

    expect(await screen.findByText("appPage.sites.detail.report.exportError")).toBeTruthy();
    expect(button().disabled).toBe(false);
    expect(clickedLink).toBeUndefined();
  });

  it("SHOULD clear a previous error WHEN retrying", async () => {
    downloadReportMock.mockRejectedValueOnce(new Error("boom"));
    render(<SiteReportExportButton site={SITE} />);
    fireEvent.click(button());
    await screen.findByText("appPage.sites.detail.report.exportError");

    fireEvent.click(button());

    await waitFor(() =>
      expect(screen.queryByText("appPage.sites.detail.report.exportError")).toBeNull(),
    );
  });
});
