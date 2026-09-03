import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` + the *relative* module path (not the "@/lib/api" alias): this
// project's Vitest config does not alias "@/" for the mock resolver, so an
// aliased target silently fails to intercept and the real fetch runs.
const { requestBaseReport, requestReport } = vi.hoisted(() => ({
  requestBaseReport: vi.fn(),
  requestReport: vi.fn(),
}));

vi.mock("../../../../../../lib/api", () => ({
  api: { DeviceVariableReports: { requestBaseReport, requestReport } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { RequestDeviceReportDialog } from "../RequestDeviceReportDialog";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";

const onRequested = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  requestBaseReport.mockResolvedValue({ ok: true, status: "Accepted", reportRequest: {} });
  requestReport.mockResolvedValue({ ok: true, status: "Accepted", reportRequest: {} });
});

const renderDialog = () =>
  render(<RequestDeviceReportDialog chargePointId={CP_ID} onRequested={onRequested} />);

const openDialog = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.deviceVariableReports.request.button"));
};

const submit = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.deviceVariableReports.request.submit"));
};

const openKindSelect = () => {
  fireEvent.pointerDown(screen.getAllByRole("combobox")[0], {
    button: 0,
    ctrlKey: false,
    pointerType: "mouse",
  });
};

describe("RequestDeviceReportDialog", () => {
  it("SHOULD request a full report by default", async () => {
    renderDialog();
    openDialog();
    submit();

    await waitFor(() => expect(requestReport).toHaveBeenCalledWith(CP_ID));
    expect(requestBaseReport).not.toHaveBeenCalled();
  });

  it("SHOULD NOT show the report-base selector for a full report", () => {
    renderDialog();
    openDialog();

    expect(
      screen.queryByText("appPage.chargePoints.deviceVariableReports.request.fields.reportBase"),
    ).toBeNull();
  });

  it("SHOULD request a base report with the chosen flavor WHEN switched to base", async () => {
    renderDialog();
    openDialog();
    openKindSelect();
    fireEvent.click(
      screen.getByText("appPage.chargePoints.deviceVariableReports.request.kinds.base"),
    );
    submit();

    await waitFor(() => expect(requestBaseReport).toHaveBeenCalledWith(CP_ID, "FullInventory"));
    expect(requestReport).not.toHaveBeenCalled();
  });

  it("SHOULD report the station's acceptance and call onRequested", async () => {
    renderDialog();
    openDialog();
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.deviceVariableReports.request.result.accepted"),
    ).toBeTruthy();
    expect(onRequested).toHaveBeenCalled();
  });

  it("SHOULD report EmptyResultSet distinctly from a plain acceptance", async () => {
    requestReport.mockResolvedValue({ ok: true, status: "EmptyResultSet", reportRequest: null });

    renderDialog();
    openDialog();
    submit();

    expect(
      await screen.findByText(
        "appPage.chargePoints.deviceVariableReports.request.result.emptyResultSet",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText("appPage.chargePoints.deviceVariableReports.request.result.accepted"),
    ).toBeNull();
    // Still a success — the station answered, it just has nothing to report.
    expect(onRequested).toHaveBeenCalled();
  });

  it.each([
    [400, "invalidRequest"],
    [404, "notFound"],
    [409, "notConnectedOrBusy"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message", async (httpStatus, key) => {
    requestReport.mockResolvedValue({ ok: false, httpStatus });

    renderDialog();
    openDialog();
    submit();

    expect(
      await screen.findByText(`appPage.chargePoints.deviceVariableReports.request.result.${key}`),
    ).toBeTruthy();
    expect(onRequested).not.toHaveBeenCalled();
  });
});
