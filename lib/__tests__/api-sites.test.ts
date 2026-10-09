import { afterEach, describe, expect, it, vi } from "vitest";

import { siteApis } from "../api-sites";
import { httpClient } from "../http-client";

vi.mock("../http-client", () => ({
  httpClient: {
    get: vi.fn(),
    getFile: vi.fn().mockResolvedValue({ blob: new Blob(["pdf"]), filename: "r.pdf" }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const lastFileUrl = () => vi.mocked(httpClient.getFile).mock.calls.at(-1)?.[0] as string;

afterEach(() => vi.clearAllMocks());

describe("siteApis.downloadReport", () => {
  it("SHOULD hit the local report proxy path for the site, with the language", async () => {
    await siteApis.downloadReport("site-1", { locale: "en" });

    expect(lastFileUrl()).toBe("/api/sites/site-1/report?locale=en");
  });

  it("SHOULD serialize the window as ISO strings WHEN one is given", async () => {
    await siteApis.downloadReport("site-1", {
      locale: "fr",
      from: new Date("2026-08-01T00:00:00.000Z"),
      to: new Date("2026-08-08T00:00:00.000Z"),
    });

    const params = new URLSearchParams(lastFileUrl().split("?")[1]);
    expect(params.get("locale")).toBe("fr");
    expect(params.get("from")).toBe("2026-08-01T00:00:00.000Z");
    expect(params.get("to")).toBe("2026-08-08T00:00:00.000Z");
  });

  it("SHOULD leave the window out WHEN none is given, so the backend picks its default", async () => {
    await siteApis.downloadReport("site-1", { locale: "fr" });

    const params = new URLSearchParams(lastFileUrl().split("?")[1]);
    expect(params.has("from")).toBe(false);
    expect(params.has("to")).toBe(false);
  });

  it("SHOULD return the downloaded file as is", async () => {
    const file = { blob: new Blob(["pdf"]), filename: "site-report.pdf" };
    vi.mocked(httpClient.getFile).mockResolvedValueOnce(file);

    await expect(siteApis.downloadReport("site-1", { locale: "fr" })).resolves.toBe(file);
  });

  it("SHOULD propagate a failure", async () => {
    vi.mocked(httpClient.getFile).mockRejectedValueOnce(new Error("boom"));

    await expect(siteApis.downloadReport("site-1", { locale: "fr" })).rejects.toThrow("boom");
  });
});
