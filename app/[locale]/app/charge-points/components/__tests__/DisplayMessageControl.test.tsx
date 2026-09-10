import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` + the *relative* module path (not the "@/lib/api" alias): this
// project's Vitest config does not alias "@/" for the mock resolver, so an
// aliased target silently fails to intercept and the real fetch runs.
const { setDisplayMessage, clearDisplayMessage } = vi.hoisted(() => ({
  setDisplayMessage: vi.fn(),
  clearDisplayMessage: vi.fn(),
}));

vi.mock("../../../../../../lib/api", () => ({
  api: { ChargePoints: { setDisplayMessage, clearDisplayMessage } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { DisplayMessageControl } from "../DisplayMessageControl";

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

const CP_ID = "cp-1";

beforeEach(() => {
  vi.clearAllMocks();
  setDisplayMessage.mockResolvedValue({ ok: true, status: "Accepted" });
  clearDisplayMessage.mockResolvedValue({ ok: true, status: "Accepted" });
});

const openDialog = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.displayMessage.set.button"));
};

const fillContent = (value: string) => {
  fireEvent.change(
    screen.getByLabelText("appPage.chargePoints.displayMessage.set.fields.content"),
    { target: { value } },
  );
};

const submit = () => {
  fireEvent.click(screen.getByText("appPage.chargePoints.displayMessage.set.submit"));
};

describe("DisplayMessageControl", () => {
  it("SHOULD send the message with the fixed id and default priority", async () => {
    render(<DisplayMessageControl chargePointId={CP_ID} />);
    openDialog();
    fillContent("Reserved for fleet vehicle");
    submit();

    await waitFor(() => expect(setDisplayMessage).toHaveBeenCalledTimes(1));
    expect(setDisplayMessage).toHaveBeenCalledWith(CP_ID, {
      id: 1,
      priority: "NormalCycle",
      content: "Reserved for fleet vehicle",
    });
  });

  it("SHOULD refuse to submit an empty message", () => {
    render(<DisplayMessageControl chargePointId={CP_ID} />);
    openDialog();

    const button = screen
      .getByText("appPage.chargePoints.displayMessage.set.submit")
      .closest("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("SHOULD show acceptance WHEN the station accepts the message", async () => {
    render(<DisplayMessageControl chargePointId={CP_ID} />);
    openDialog();
    fillContent("Hello");
    submit();

    expect(
      await screen.findByText("appPage.chargePoints.displayMessage.set.result.accepted"),
    ).toBeTruthy();
  });

  it("SHOULD show the station's own rejection reason WHEN it declines the message", async () => {
    setDisplayMessage.mockResolvedValue({ ok: true, status: "NotSupportedPriority" });

    render(<DisplayMessageControl chargePointId={CP_ID} />);
    openDialog();
    fillContent("Hello");
    submit();

    expect(
      await screen.findByText(
        "appPage.chargePoints.displayMessage.set.result.notSupportedPriority",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText("appPage.chargePoints.displayMessage.set.result.accepted"),
    ).toBeNull();
  });

  it.each([
    [404, "notFound"],
    [409, "notConnectedOrUnsupported"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message on send", async (httpStatus, key) => {
    setDisplayMessage.mockResolvedValue({ ok: false, httpStatus });

    render(<DisplayMessageControl chargePointId={CP_ID} />);
    openDialog();
    fillContent("Hello");
    submit();

    expect(
      await screen.findByText(`appPage.chargePoints.displayMessage.set.result.${key}`),
    ).toBeTruthy();
  });

  it("SHOULD clear the fixed message id WHEN the clear button is pressed", async () => {
    render(<DisplayMessageControl chargePointId={CP_ID} />);
    fireEvent.click(screen.getByText("appPage.chargePoints.displayMessage.clear.button"));

    await waitFor(() => expect(clearDisplayMessage).toHaveBeenCalledWith(CP_ID, 1));
    expect(
      await screen.findByText("appPage.chargePoints.displayMessage.clear.result.accepted"),
    ).toBeTruthy();
  });

  it("SHOULD treat Unknown as an informational, non-error outcome on clear", async () => {
    clearDisplayMessage.mockResolvedValue({ ok: true, status: "Unknown" });

    render(<DisplayMessageControl chargePointId={CP_ID} />);
    fireEvent.click(screen.getByText("appPage.chargePoints.displayMessage.clear.button"));

    expect(
      await screen.findByText("appPage.chargePoints.displayMessage.clear.result.unknown"),
    ).toBeTruthy();
  });

  it.each([
    [404, "notFound"],
    [409, "notConnectedOrUnsupported"],
    [502, "stationError"],
    [504, "timeout"],
    [0, "genericError"],
  ])("SHOULD map HTTP %i to its own message on clear", async (httpStatus, key) => {
    clearDisplayMessage.mockResolvedValue({ ok: false, httpStatus });

    render(<DisplayMessageControl chargePointId={CP_ID} />);
    fireEvent.click(screen.getByText("appPage.chargePoints.displayMessage.clear.button"));

    expect(
      await screen.findByText(`appPage.chargePoints.displayMessage.clear.result.${key}`),
    ).toBeTruthy();
  });
});
