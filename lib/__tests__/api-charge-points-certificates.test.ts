import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../http-client", () => ({
  httpClient: { post: vi.fn().mockResolvedValue({ status: "Accepted", certificates: [] }) },
}));

import { chargePointApis } from "../api-charge-points";
import { httpClient } from "../http-client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const respondWith = (body: unknown, ok = true, status = 200) =>
  fetchMock.mockResolvedValue({ ok, status, json: async () => body });

const lastCall = () => fetchMock.mock.calls.at(-1) as [string, RequestInit];

const CERTIFICATE_HASH_DATA = {
  hashAlgorithm: "SHA256" as const,
  issuerNameHash: "issuer-hash",
  issuerKeyHash: "key-hash",
  serialNumber: "1234",
};

describe("chargePointApis.listCertificates", () => {
  it("SHOULD POST to the certificates query endpoint with no body WHEN no filter is given", async () => {
    await chargePointApis.listCertificates("cp-1");

    expect(httpClient.post).toHaveBeenCalledWith("/api/charge-points/cp-1/certificates/query", {});
  });

  it("SHOULD forward the certificateType filter WHEN given", async () => {
    await chargePointApis.listCertificates("cp-1", ["CSMSRootCertificate"]);

    expect(httpClient.post).toHaveBeenCalledWith("/api/charge-points/cp-1/certificates/query", {
      certificateType: ["CSMSRootCertificate"],
    });
  });
});

describe("chargePointApis.installCertificate", () => {
  it("SHOULD POST the certificate type and PEM body to the certificates endpoint", async () => {
    respondWith({ status: "Accepted" });

    await chargePointApis.installCertificate("cp-1", {
      certificateType: "CSMSRootCertificate",
      certificate: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
    });

    const [url, init] = lastCall();
    expect(url).toBe("/api/charge-points/cp-1/certificates");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      certificateType: "CSMSRootCertificate",
      certificate: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
    });
  });

  it.each(["Accepted", "Rejected", "Failed"] as const)(
    "SHOULD return the station's %s status",
    async (status) => {
      respondWith({ status, statusInfo: status === "Accepted" ? undefined : "reason" });

      const outcome = await chargePointApis.installCertificate("cp-1", {
        certificateType: "CSMSRootCertificate",
        certificate: "cert",
      });

      expect(outcome).toEqual({
        ok: true,
        status,
        statusInfo: status === "Accepted" ? undefined : "reason",
      });
    },
  );

  it("SHOULD surface the raw HTTP status WHEN the request fails", async () => {
    respondWith({ message: "not connected" }, false, 409);

    expect(
      await chargePointApis.installCertificate("cp-1", {
        certificateType: "CSMSRootCertificate",
        certificate: "cert",
      }),
    ).toEqual({ ok: false, httpStatus: 409 });
  });

  it("SHOULD report httpStatus 0 WHEN the request never reached the proxy", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await chargePointApis.installCertificate("cp-1", {
        certificateType: "CSMSRootCertificate",
        certificate: "cert",
      }),
    ).toEqual({ ok: false, httpStatus: 0 });
  });
});

describe("chargePointApis.deleteCertificate", () => {
  it("SHOULD DELETE with the certificateHashData in the body", async () => {
    respondWith({ status: "Accepted" });

    await chargePointApis.deleteCertificate("cp-1", CERTIFICATE_HASH_DATA);

    const [url, init] = lastCall();
    expect(url).toBe("/api/charge-points/cp-1/certificates");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({
      certificateHashData: CERTIFICATE_HASH_DATA,
    });
  });

  it.each(["Accepted", "Failed", "NotFound"] as const)(
    "SHOULD return the station's %s status",
    async (status) => {
      respondWith({ status });

      expect(await chargePointApis.deleteCertificate("cp-1", CERTIFICATE_HASH_DATA)).toEqual({
        ok: true,
        status,
        statusInfo: undefined,
      });
    },
  );

  it("SHOULD surface the raw HTTP status WHEN the request fails", async () => {
    respondWith({ message: "not connected" }, false, 409);

    expect(await chargePointApis.deleteCertificate("cp-1", CERTIFICATE_HASH_DATA)).toEqual({
      ok: false,
      httpStatus: 409,
    });
  });

  it("SHOULD report httpStatus 0 WHEN the request never reached the proxy", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await chargePointApis.deleteCertificate("cp-1", CERTIFICATE_HASH_DATA)).toEqual({
      ok: false,
      httpStatus: 0,
    });
  });
});
