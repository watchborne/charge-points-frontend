import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` + the *relative* module path (not the "@/lib/api" alias): this
// project's Vitest config does not alias "@/" for the mock resolver, so an
// aliased target silently fails to intercept and the real fetch runs.
const { startLogUpload } = vi.hoisted(() => ({ startLogUpload: vi.fn() }));

vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { startLogUpload } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { StartLogUploadDialog } from "../StartLogUploadDialog";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";
const LOCATION = "https://uploads.example.com/logs";

const onStarted = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  startLogUpload.mockResolvedValue({ ok: true, status: "Accepted", upload: {} });
});

const renderDialog = (
  overrides: { ocppVersion?: "1.6" | "2.0.1"; uploadInProgress?: boolean } = {},
) =>
  render(
    <StartLogUploadDialog
      chargePointId={CP_ID}
      ocppVersion={overrides.ocppVersion ?? "2.0.1"}
      uploadInProgress={overrides.uploadInProgress ?? false}
      onStarted={onStarted}
    />,
  );

const openDialog = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.logUpload.start.button"));
};

const fillLocation = (value: string) => {
  fireEvent.change(
    screen.getByLabelText("appPage.chargePoints.logUpload.start.fields.remoteLocation"),
    { target: { value } },
  );
};

const submit = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.logUpload.start.submit"));
};

const openLogTypeSelect = () => {
  fireEvent.pointerDown(screen.getByRole("combobox"), {
    button: 0,
    ctrlKey: false,
    pointerType: "mouse",
  });
};

describe("StartLogUploadDialog", () => {
  it("SHOULD disable the trigger WHEN an upload is already in progress", () => {
    renderDialog({ uploadInProgress: true });

    const trigger = screen
      .getByText("appPage.chargePoints.logUpload.start.button")
      .closest("button");
    expect(trigger?.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD start the upload with the filled-in location and default log type", async () => {
    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    await waitFor(() => expect(startLogUpload).toHaveBeenCalledTimes(1));
    const [chargePointId, body] = startLogUpload.mock.calls[0];
    expect(chargePointId).toBe(CP_ID);
    expect(body.remoteLocation).toBe(LOCATION);
    expect(body.logType).toBe("DiagnosticsLog");
  });

  it("SHOULD omit the optional window timestamps WHEN left blank", async () => {
    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    await waitFor(() => expect(startLogUpload).toHaveBeenCalled());
    const [, body] = startLogUpload.mock.calls[0];
    expect(body.oldestTimestamp).toBeUndefined();
    expect(body.latestTimestamp).toBeUndefined();
  });

  it("SHOULD offer the security-log option to an OCPP 2.0.1 station", () => {
    renderDialog({ ocppVersion: "2.0.1" });
    openDialog();
    openLogTypeSelect();

    expect(screen.getByText("appPage.chargePoints.logUpload.logTypes.SecurityLog")).toBeTruthy();
    expect(
      screen.queryByText("appPage.chargePoints.logUpload.start.unsupportedSecurityLog"),
    ).toBeNull();
  });

  it("SHOULD hide the security-log option for an OCPP 1.6 station and explain why", () => {
    renderDialog({ ocppVersion: "1.6" });
    openDialog();
    openLogTypeSelect();

    // 1.6 has no logType concept at all, so offering it would be a lie.
    expect(screen.queryByText("appPage.chargePoints.logUpload.logTypes.SecurityLog")).toBeNull();
    expect(
      screen.getByText("appPage.chargePoints.logUpload.start.unsupportedSecurityLog"),
    ).toBeTruthy();
  });

  it("SHOULD refuse to submit an empty location", () => {
    renderDialog();
    openDialog();

    const button = screen
      .getByText("appPage.chargePoints.logUpload.start.submit")
      .closest("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it.each(["not a url", "/logs/upload", "file:///etc/passwd", "javascript:alert(1)"])(
    "SHOULD reject %j as an upload target",
    (value) => {
      renderDialog();
      openDialog();
      fillLocation(value);

      // Convenience only — the backend stays authoritative on this field.
      expect(
        screen.getByText("appPage.chargePoints.logUpload.start.fields.remoteLocationInvalid"),
      ).toBeTruthy();
      const button = screen
        .getByText("appPage.chargePoints.logUpload.start.submit")
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
      await screen.findByText("appPage.chargePoints.logUpload.start.result.accepted"),
    ).toBeTruthy();
    expect(onStarted).toHaveBeenCalled();
  });

  it("SHOULD say 'requested' rather than 'accepted' WHEN the station reported no status", async () => {
    // A 1.6 station acknowledges the frame and nothing more (its GetDiagnostics.conf
    // carries no accept/reject vocabulary), so claiming it accepted would assert
    // something it never said.
    startLogUpload.mockResolvedValue({ ok: true, status: null, upload: {} });

    renderDialog({ ocppVersion: "1.6" });
    openDialog();
    fillLocation(LOCATION);
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.logUpload.start.result.requested"),
    ).toBeTruthy();
    expect(screen.queryByText("appPage.chargePoints.logUpload.start.result.accepted")).toBeNull();
  });

  it.each([
    [400, "invalidRequest"],
    [404, "notFound"],
    [409, "notConnectedOrRejected"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message", async (httpStatus, key) => {
    startLogUpload.mockResolvedValue({ ok: false, httpStatus });

    renderDialog();
    openDialog();
    fillLocation(LOCATION);
    submit();

    expect(
      await screen.findByText(`appPage.chargePoints.logUpload.start.result.${key}`),
    ).toBeTruthy();
    expect(onStarted).not.toHaveBeenCalled();
  });
});
