import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { chargePointApis } from "../api-charge-points";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

const respondWith = (body: unknown, ok = true, status = 200) =>
  fetchMock.mockResolvedValue({ ok, status, json: async () => body });

const lastCall = () => fetchMock.mock.calls.at(-1) as [string, RequestInit];

describe("chargePointApis.setDisplayMessage", () => {
  it("SHOULD POST the wire-shaped MessageInfo to the display-messages endpoint", async () => {
    respondWith({ status: "Accepted" });

    await chargePointApis.setDisplayMessage("cp-1", {
      id: 1,
      priority: "AlwaysFront",
      content: "Reserved for fleet vehicle",
    });

    const [url, init] = lastCall();
    expect(url).toBe("/api/charge-points/cp-1/display-messages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      message: {
        id: 1,
        priority: "AlwaysFront",
        message: { format: "UTF8", content: "Reserved for fleet vehicle" },
      },
    });
  });

  it.each(["Accepted", "Rejected", "NotSupportedMessageFormat"] as const)(
    "SHOULD return the station's %s status",
    async (status) => {
      respondWith({ status });

      expect(
        await chargePointApis.setDisplayMessage("cp-1", {
          id: 1,
          priority: "NormalCycle",
          content: "Hello",
        }),
      ).toEqual({ ok: true, status });
    },
  );

  it("SHOULD surface the raw HTTP status WHEN the request fails", async () => {
    respondWith({ message: "not connected" }, false, 409);

    expect(
      await chargePointApis.setDisplayMessage("cp-1", {
        id: 1,
        priority: "NormalCycle",
        content: "Hello",
      }),
    ).toEqual({ ok: false, httpStatus: 409 });
  });

  it("SHOULD report httpStatus 0 WHEN the request never reached the proxy", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await chargePointApis.setDisplayMessage("cp-1", {
        id: 1,
        priority: "NormalCycle",
        content: "Hello",
      }),
    ).toEqual({ ok: false, httpStatus: 0 });
  });
});

describe("chargePointApis.clearDisplayMessage", () => {
  it("SHOULD DELETE the message id in the URL, with no body", async () => {
    respondWith({ status: "Accepted" });

    await chargePointApis.clearDisplayMessage("cp-1", 1);

    const [url, init] = lastCall();
    expect(url).toBe("/api/charge-points/cp-1/display-messages/1");
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });

  it.each(["Accepted", "Unknown"] as const)("SHOULD return the station's %s status", async (status) => {
    respondWith({ status });

    expect(await chargePointApis.clearDisplayMessage("cp-1", 1)).toEqual({ ok: true, status });
  });

  it("SHOULD surface the raw HTTP status WHEN the request fails", async () => {
    respondWith({ message: "not connected" }, false, 409);

    expect(await chargePointApis.clearDisplayMessage("cp-1", 1)).toEqual({
      ok: false,
      httpStatus: 409,
    });
  });

  it("SHOULD report httpStatus 0 WHEN the request never reached the proxy", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await chargePointApis.clearDisplayMessage("cp-1", 1)).toEqual({
      ok: false,
      httpStatus: 0,
    });
  });
});
