import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChargePointActionsSection } from "../ChargePointActionsSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Each child owns its own tests; here they only expose the `disabled` they were given.
vi.mock("../ChargePointConfigurationDialog", () => ({
  ChargePointConfigurationDialog: ({ disabled }: { disabled?: boolean }) => (
    <button data-testid="configuration" disabled={disabled} />
  ),
}));
vi.mock("../TriggerMessageControl", () => ({
  TriggerMessageControl: ({ disabled }: { disabled?: boolean }) => (
    <button data-testid="trigger" disabled={disabled} />
  ),
}));
vi.mock("../DisplayMessageControl", () => ({
  DisplayMessageControl: ({ disabled }: { disabled?: boolean }) => (
    <button data-testid="display-message" disabled={disabled} />
  ),
}));
vi.mock("../DisplayMessagesPanel", () => ({
  DisplayMessagesPanel: ({ disabled }: { disabled?: boolean }) => (
    <button data-testid="display-messages" disabled={disabled} />
  ),
}));
vi.mock("../ChargePointReleaseControl", () => ({
  ChargePointReleaseControl: () => <button data-testid="release" />,
}));

const renderSection = (isActive: boolean) =>
  render(
    <ChargePointActionsSection
      chargePointId="cp-1"
      chargePointName="Borne 1"
      isActive={isActive}
      ocppVersion="2.0.1"
      resetState={{ status: "idle" }}
      onReset={vi.fn()}
      wholeChargePointAvailability={{ status: "idle" }}
      onChangeAvailability={vi.fn()}
      onReleased={vi.fn()}
    />,
  );

describe("ChargePointActionsSection", () => {
  afterEach(cleanup);

  it("SHOULD disable every command control and explain why WHEN the charge point is inactive", () => {
    renderSection(false);

    expect(screen.getByText("appPage.chargePoints.actionsTab.inactiveNotice")).toBeTruthy();
    expect(screen.getByRole("button", { name: /reset\.button/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /availability\.wholeChargePoint/ })).toHaveProperty(
      "disabled",
      true,
    );
    for (const id of ["configuration", "trigger", "display-message", "display-messages"]) {
      expect(screen.getByTestId(id)).toHaveProperty("disabled", true);
    }
  });

  it("SHOULD keep giving up access possible WHEN the charge point is inactive", () => {
    renderSection(false);

    expect(screen.getByTestId("release")).toHaveProperty("disabled", false);
  });

  it("SHOULD enable the command controls WHEN the charge point is active", () => {
    renderSection(true);

    expect(screen.queryByText("appPage.chargePoints.actionsTab.inactiveNotice")).toBeNull();
    expect(screen.getByRole("button", { name: /reset\.button/ })).toHaveProperty("disabled", false);
    expect(screen.getByTestId("trigger")).toHaveProperty("disabled", false);
  });
});
