import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.chargePoints.form.createTitle": "Add a charge point",
      "appPage.chargePoints.form.editTitle": "Edit the charge point",
      "appPage.chargePoints.form.createDescription": "Fill in details.",
      "appPage.chargePoints.form.editDescription": "Edit details.",
      "appPage.chargePoints.form.buttons.create": "Create",
      "appPage.chargePoints.form.buttons.save": "Save",
      "appPage.chargePoints.form.buttons.cancel": "Cancel",
      "appPage.chargePoints.form.fields.name": "Name",
      "appPage.chargePoints.form.fields.namePlaceholder": "Ex: CP-001",
      "appPage.chargePoints.form.fields.nameCreatePlaceholder":
        "Optional — a name will be generated if left blank",
      "appPage.chargePoints.form.fields.site": "Site",
      "appPage.chargePoints.form.fields.technicalInformation": "Technical information",
      "appPage.sites.siteCombobox.unassigned": "Unassigned",
    };
    return map[key] ?? key;
  },
}));

import { ChargePointFormDialog } from "../ChargePointFormDialog";

afterEach(() => cleanup());

describe("ChargePointFormDialog", () => {
  it("SHOULD leave the name field enabled WHEN editing a charge point", () => {
    render(
      <ChargePointFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        mode="edit"
        sites={[]}
        initialValues={{ name: "Existing name", siteId: "" }}
      />,
    );

    // ADR 0010 (charge-points-server): renaming used to be locked outside
    // create mode because `name` doubled as the OCPP reconnection key. It no
    // longer does, so the field must stay editable here.
    expect(screen.getByLabelText("Name")).toHaveProperty("disabled", false);
  });

  it("SHOULD show the optional-name placeholder WHEN creating a charge point", () => {
    render(
      <ChargePointFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        mode="create"
        sites={[]}
      />,
    );

    expect(
      screen.getByPlaceholderText("Optional — a name will be generated if left blank"),
    ).toBeTruthy();
  });

  it("SHOULD submit with an empty name WHEN creating without one (ADR 0010)", async () => {
    const onSubmit = vi.fn();
    render(
      <ChargePointFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        mode="create"
        sites={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "" })),
    );
  });

  it("SHOULD reject an empty name WHEN editing a charge point", async () => {
    const onSubmit = vi.fn();
    render(
      <ChargePointFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        mode="edit"
        sites={[]}
        initialValues={{ name: "Existing name", siteId: "" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("Name is required")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
