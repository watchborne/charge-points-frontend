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

/**
 * These pin the endpoint, not the transport: `/settings` is what makes an OCPP
 * 2.0.1 station readable at all, since the backend picks GetVariables/
 * SetVariables for it (issue #270). Pointing these back at `/configuration`
 * would compile, pass every UI test, and silently break 2.0.1 stations again.
 */
describe("chargePointApis.getSettings", () => {
  it("SHOULD POST to the dialect-neutral settings endpoint", async () => {
    respondWith({ configurationKey: [] });

    await chargePointApis.getSettings("cp-1");

    const [url, init] = lastCall();
    expect(url).toBe("/api/charge-points/cp-1/settings");
    expect(init.method).toBe("POST");
  });

  it("SHOULD send an empty body WHEN reading every key", async () => {
    respondWith({ configurationKey: [] });

    await chargePointApis.getSettings("cp-1");

    expect(JSON.parse(lastCall()[1].body as string)).toEqual({});
  });

  it("SHOULD send the requested keys WHEN given some", async () => {
    respondWith({ configurationKey: [] });

    await chargePointApis.getSettings("cp-1", ["HeartbeatInterval"]);

    expect(JSON.parse(lastCall()[1].body as string)).toEqual({ key: ["HeartbeatInterval"] });
  });

  it("SHOULD return the reported keys WHEN the read succeeds", async () => {
    respondWith({
      configurationKey: [{ key: "HeartbeatInterval", readonly: false, value: "300" }],
      unknownKey: ["MadeUpKey"],
    });

    const outcome = await chargePointApis.getSettings("cp-1");

    expect(outcome).toEqual({
      ok: true,
      configurationKey: [{ key: "HeartbeatInterval", readonly: false, value: "300" }],
      unknownKey: ["MadeUpKey"],
    });
  });

  it("SHOULD surface the raw HTTP status WHEN the read fails", async () => {
    respondWith({ message: "not connected" }, false, 409);

    expect(await chargePointApis.getSettings("cp-1")).toEqual({ ok: false, httpStatus: 409 });
  });

  it("SHOULD report httpStatus 0 WHEN the request never reached the proxy", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await chargePointApis.getSettings("cp-1")).toEqual({ ok: false, httpStatus: 0 });
  });
});

describe("chargePointApis.setSetting", () => {
  it("SHOULD PUT the flat key/value to the dialect-neutral settings endpoint", async () => {
    respondWith({ status: "Accepted" });

    await chargePointApis.setSetting("cp-1", "HeartbeatInterval", "600");

    const [url, init] = lastCall();
    expect(url).toBe("/api/charge-points/cp-1/settings");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      key: "HeartbeatInterval",
      value: "600",
    });
  });

  it.each(["Accepted", "RebootRequired"] as const)(
    "SHOULD return the station's %s status",
    async (status) => {
      respondWith({ status });

      expect(await chargePointApis.setSetting("cp-1", "HeartbeatInterval", "600")).toEqual({
        ok: true,
        status,
      });
    },
  );

  it("SHOULD surface the raw HTTP status WHEN the write fails", async () => {
    respondWith({ message: "unsupported setting" }, false, 409);

    expect(await chargePointApis.setSetting("cp-1", "MadeUpKey", "1")).toEqual({
      ok: false,
      httpStatus: 409,
    });
  });

  it("SHOULD report httpStatus 0 WHEN the request never reached the proxy", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await chargePointApis.setSetting("cp-1", "HeartbeatInterval", "600")).toEqual({
      ok: false,
      httpStatus: 0,
    });
  });
});
