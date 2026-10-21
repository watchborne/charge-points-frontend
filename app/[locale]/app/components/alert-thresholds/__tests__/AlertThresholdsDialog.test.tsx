import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => key,
}));

import { AlertThresholdsDialog } from "../AlertThresholdsDialog";

afterEach(() => cleanup());

const NO_OVERRIDES = {
  offlineAfterMs: null,
  connectorStuckUnavailableAfterMs: null,
  firmwareStaleAfterMs: null,
};

const EFFECTIVE = {
  values: {
    offlineAfterMs: 3_600_000,
    connectorStuckUnavailableAfterMs: 14_400_000,
    firmwareStaleAfterMs: 1_800_000,
  },
  sources: {
    offlineAfterMs: "default" as const,
    connectorStuckUnavailableAfterMs: "default" as const,
    firmwareStaleAfterMs: "default" as const,
  },
};

const renderDialog = (props: Partial<Parameters<typeof AlertThresholdsDialog>[0]> = {}) =>
  render(
    <AlertThresholdsDialog
      open
      onOpenChange={vi.fn()}
      title="dialog-title"
      description="dialog-description"
      overrides={NO_OVERRIDES}
      effective={EFFECTIVE}
      onSubmit={vi.fn()}
      {...props}
    />,
  );

const inputs = () => screen.getAllByRole("spinbutton") as HTMLInputElement[];

describe("AlertThresholdsDialog", () => {
  it("SHOULD show the given title and one field per threshold", () => {
    renderDialog();

    expect(screen.getByText("dialog-title")).toBeTruthy();
    expect(inputs()).toHaveLength(3);
  });

  it("SHOULD show overrides in minutes and leave inherited fields empty", () => {
    renderDialog({ overrides: { ...NO_OVERRIDES, offlineAfterMs: 7_200_000 } });

    expect(inputs().map((input) => input.value)).toEqual(["120", "", ""]);
  });

  it("SHOULD send null for every field WHEN submitted untouched with no overrides", async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(NO_OVERRIDES);
  });

  it("SHOULD send a typed value in milliseconds WHEN submitted", async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    fireEvent.change(inputs()[0], { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ ...NO_OVERRIDES, offlineAfterMs: 7_200_000 }),
    );
  });

  it("SHOULD send null for an emptied field WHEN clearing an existing override", async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit, overrides: { ...NO_OVERRIDES, offlineAfterMs: 7_200_000 } });

    fireEvent.change(inputs()[0], { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(NO_OVERRIDES));
  });

  it("SHOULD not submit WHEN a value is below the minimum", async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    fireEvent.change(inputs()[0], { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() =>
      expect(screen.getByText("appPage.alertThresholds.dialog.rangeError")).toBeTruthy(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("SHOULD not submit WHEN a value is above the maximum", async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    fireEvent.change(inputs()[1], { target: { value: "10081" } });
    fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));

    await waitFor(() =>
      expect(screen.getByText("appPage.alertThresholds.dialog.rangeError")).toBeTruthy(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("SHOULD not show the currently-applied hint WHEN effective thresholds are not loaded", () => {
    renderDialog({ effective: null });

    expect(screen.queryByText(/currentlyApplied/)).toBeNull();
  });
});
