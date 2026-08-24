import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` + the *relative* module path (not the "@/lib/api" alias): this
// project's Vitest config does not alias "@/" for the mock resolver, so an
// aliased target silently fails to intercept and the real fetch runs.
const { startFirmwareUpdate } = vi.hoisted(() => ({ startFirmwareUpdate: vi.fn() }));

vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { startFirmwareUpdate } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { UpdateFirmwareDialog } from "../UpdateFirmwareDialog";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";
const LOCATION = "https://firmware.example.com/2.4.1.bin";

const onStarted = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  startFirmwareUpdate.mockResolvedValue({ ok: true, status: "Accepted", update: {} });
});

const renderDialog = (
  overrides: { ocppVersion?: "1.6" | "2.0.1"; updateInProgress?: boolean } = {},
) =>
  render(
    <UpdateFirmwareDialog
      chargePointId={CP_ID}
      ocppVersion={overrides.ocppVersion ?? "2.0.1"}
      updateInProgress={overrides.updateInProgress ?? false}
      onStarted={onStarted}
    />,
  );

const openDialog = () => {
  fireEvent.click(
    screen.getByRole("button", { name: "appPage.chargePoints.firmware.update.button" }),
  );
};

const fillLocation = (value: string) => {
  fireEvent.change(screen.getByLabelText("appPage.chargePoints.firmware.update.fields.location"), {
    target: { value },
  });
};

const submit = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.firmware.update.submit"));
};

describe("UpdateFirmwareDialog", () => {
  it("SHOULD disable the trigger WHEN an update is already in progress", () => {
    renderDialog({ updateInProgress: true });

    const trigger = screen.getByRole("button", {
      name: "appPage.chargePoints.firmware.update.button",
    });
    expect(trigger?.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD start the update with the filled-in location", async () => {
    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    await waitFor(() => expect(startFirmwareUpdate).toHaveBeenCalledTimes(1));
    const [chargePointId, body] = startFirmwareUpdate.mock.calls[0];
    expect(chargePointId).toBe(CP_ID);
    expect(body.location).toBe(LOCATION);
    // Sent as an unambiguous instant, not the input's bare local-time string.
    expect(body.retrieveDateTime).toMatch(/Z$/);
  });

  it("SHOULD omit the optional retry fields WHEN left blank", async () => {
    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    await waitFor(() => expect(startFirmwareUpdate).toHaveBeenCalled());
    const [, body] = startFirmwareUpdate.mock.calls[0];
    expect(body.retries).toBeUndefined();
    expect(body.retryInterval).toBeUndefined();
  });

  it("SHOULD send the retry policy WHEN filled in", async () => {
    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    fireEvent.change(screen.getByLabelText("appPage.chargePoints.firmware.update.fields.retries"), {
      target: { value: "3" },
    });
    fireEvent.change(
      screen.getByLabelText("appPage.chargePoints.firmware.update.fields.retryInterval"),
      { target: { value: "60" } },
    );
    submit();

    await waitFor(() => expect(startFirmwareUpdate).toHaveBeenCalled());
    const [, body] = startFirmwareUpdate.mock.calls[0];
    expect(body.retries).toBe(3);
    expect(body.retryInterval).toBe(60);
  });

  it("SHOULD offer the signed-firmware fields to an OCPP 2.0.1 station", () => {
    renderDialog({ ocppVersion: "2.0.1" });
    openDialog();

    expect(
      screen.getByLabelText("appPage.chargePoints.firmware.update.fields.signature"),
    ).toBeTruthy();
    expect(screen.queryByText("appPage.chargePoints.firmware.update.unsignedDialect")).toBeNull();
  });

  it("SHOULD hide them for an OCPP 1.6 station and explain why", () => {
    renderDialog({ ocppVersion: "1.6" });
    openDialog();

    // 1.6 has nowhere to put them, so offering the fields would be a lie.
    expect(
      screen.queryByLabelText("appPage.chargePoints.firmware.update.fields.signature"),
    ).toBeNull();
    expect(screen.getByText("appPage.chargePoints.firmware.update.unsignedDialect")).toBeTruthy();
  });

  it("SHOULD NOT send signing material to a 1.6 station", async () => {
    renderDialog({ ocppVersion: "1.6" });
    openDialog();
    fillLocation(LOCATION);
    submit();

    await waitFor(() => expect(startFirmwareUpdate).toHaveBeenCalled());
    const [, body] = startFirmwareUpdate.mock.calls[0];
    expect("signingCertificate" in body).toBe(false);
    expect("signature" in body).toBe(false);
  });

  it("SHOULD refuse to submit an empty location", () => {
    renderDialog();
    openDialog();

    const button = screen
      .getByText("appPage.chargePoints.firmware.update.submit")
      .closest("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it.each(["not a url", "/firmware/2.4.1.bin", "file:///etc/passwd", "javascript:alert(1)"])(
    "SHOULD reject %j as a firmware location",
    (value) => {
      renderDialog();
      openDialog();
      fillLocation(value);

      // Convenience only — the backend stays authoritative on this field.
      expect(
        screen.getByText("appPage.chargePoints.firmware.update.fields.locationInvalid"),
      ).toBeTruthy();
      const button = screen
        .getByText("appPage.chargePoints.firmware.update.submit")
        .closest("button");
      expect(button?.hasAttribute("disabled")).toBe(true);
    },
  );

  it("SHOULD report a 2.0.1 station's acceptance", async () => {
    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.firmware.update.result.accepted"),
    ).toBeTruthy();
    expect(onStarted).toHaveBeenCalled();
  });

  it("SHOULD say 'requested' rather than 'accepted' WHEN the station reported no status", async () => {
    // A 1.6 station acknowledges the frame and nothing more (its response payload
    // is empty), so claiming it accepted would assert something it never said.
    startFirmwareUpdate.mockResolvedValue({ ok: true, status: null, update: {} });

    renderDialog({ ocppVersion: "1.6" });
    openDialog();
    fillLocation(LOCATION);
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.firmware.update.result.requested"),
    ).toBeTruthy();
    expect(screen.queryByText("appPage.chargePoints.firmware.update.result.accepted")).toBeNull();
  });

  it.each([
    [400, "invalidRequest"],
    [404, "notFound"],
    [409, "notConnectedOrRejected"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message", async (httpStatus, key) => {
    startFirmwareUpdate.mockResolvedValue({ ok: false, httpStatus });

    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    expect(
      await screen.findByText(`appPage.chargePoints.firmware.update.result.${key}`),
    ).toBeTruthy();
    expect(onStarted).not.toHaveBeenCalled();
  });
});
