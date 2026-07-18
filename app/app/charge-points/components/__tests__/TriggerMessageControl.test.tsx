import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { triggerMessage } = vi.hoisted(() => ({ triggerMessage: vi.fn() }));

vi.mock("@/lib/api", () => ({
  api: { ChargePoints: { triggerMessage } },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.trigger.button": "Trigger a message",
      "appPage.chargePoints.trigger.types.BootNotification": "Boot notification",
      "appPage.chargePoints.trigger.types.DiagnosticsStatusNotification": "Diagnostics status",
      "appPage.chargePoints.trigger.types.FirmwareStatusNotification": "Firmware status",
      "appPage.chargePoints.trigger.types.Heartbeat": "Heartbeat",
      "appPage.chargePoints.trigger.types.MeterValues": "Meter values",
      "appPage.chargePoints.trigger.types.StatusNotification": "Status notification",
      "appPage.chargePoints.trigger.result.accepted": "Accepted.",
      "appPage.chargePoints.trigger.result.notConnectedOrRejected": "Cannot trigger.",
    };
    return map[key] ?? key;
  },
}));

import { TriggerMessageControl } from "../TriggerMessageControl";

// Radix DropdownMenu opens on pointer events and uses pointer-capture APIs jsdom
// doesn't implement; polyfill them so the menu can open in tests.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

const openMenu = (name: RegExp) => {
  const trigger = screen.getByRole("button", { name });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
};

afterEach(() => {
  cleanup();
  triggerMessage.mockReset();
});

describe("TriggerMessageControl", () => {
  it("SHOULD trigger the chosen message and show success WHEN a type is picked", async () => {
    triggerMessage.mockResolvedValue({ ok: true, status: "Accepted" });

    render(<TriggerMessageControl chargePointId="cp-1" />);
    openMenu(/trigger a message/i);

    const item = await screen.findByText("Status notification");
    fireEvent.click(item);

    await waitFor(() => expect(screen.getByText("Accepted.")).toBeTruthy());
    expect(triggerMessage).toHaveBeenCalledWith("cp-1", "StatusNotification");
  });

  it("SHOULD show an error message WHEN the station is offline or rejects", async () => {
    triggerMessage.mockResolvedValue({ ok: false, httpStatus: 409 });

    render(<TriggerMessageControl chargePointId="cp-1" />);
    openMenu(/trigger a message/i);
    fireEvent.click(await screen.findByText("Boot notification"));

    await waitFor(() => expect(screen.getByText("Cannot trigger.")).toBeTruthy());
  });
});
