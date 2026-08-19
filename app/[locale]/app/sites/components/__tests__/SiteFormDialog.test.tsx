import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "appPage.sites.form.createTitle": "New site",
      "appPage.sites.form.editTitle": "Edit site",
      "appPage.sites.form.createDescription": "Add a new site.",
      "appPage.sites.form.editDescription": "Update this site.",
      "appPage.sites.form.fields.siteName": "Site name",
      "appPage.sites.form.fields.siteNamePlaceholder": "e.g. Paris Nord",
      "appPage.sites.form.fields.customerName": "Customer",
      "appPage.sites.form.fields.customerNamePlaceholder": "e.g. LVMH",
      "appPage.sites.form.fields.installDate": "Install date",
      "appPage.sites.form.fields.installDatePlaceholder": "Pick a date",
      "appPage.sites.form.fields.lastVisit": "Last visit",
      "appPage.sites.form.fields.lastVisitPlaceholder": "Pick a date",
      "appPage.sites.form.buttons.cancel": "Cancel",
      "appPage.sites.form.buttons.create": "Create",
      "appPage.sites.form.buttons.save": "Save",
    };
    return map[key] ?? key;
  },
}));

import { SiteFormDialog } from "../SiteFormDialog";

afterEach(() => cleanup());

describe("SiteFormDialog", () => {
  it("SHOULD show the create title and submit label WHEN mode is create", () => {
    render(<SiteFormDialog open onOpenChange={vi.fn()} mode="create" onSubmit={vi.fn()} />);

    expect(screen.getByText("New site")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create" })).toBeTruthy();
  });

  it("SHOULD show the edit title and submit label WHEN mode is edit", () => {
    render(<SiteFormDialog open onOpenChange={vi.fn()} mode="edit" onSubmit={vi.fn()} />);

    expect(screen.getByText("Edit site")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("SHOULD prefill the fields WHEN initialValues are given", () => {
    render(
      <SiteFormDialog
        open
        onOpenChange={vi.fn()}
        mode="edit"
        onSubmit={vi.fn()}
        initialValues={{ name: "Paris Nord", customer: "LVMH" }}
      />,
    );

    expect(screen.getByPlaceholderText("e.g. Paris Nord")).toHaveProperty("value", "Paris Nord");
    expect(screen.getByPlaceholderText("e.g. LVMH")).toHaveProperty("value", "LVMH");
  });

  it("SHOULD call onSubmit with the typed name/customer and close the dialog WHEN submitted", async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SiteFormDialog
        open
        onOpenChange={onOpenChange}
        mode="create"
        onSubmit={onSubmit}
        initialValues={{
          installedAt: new Date("2024-01-01T00:00:00.000Z"),
          lastVisitedAt: new Date("2024-01-02T00:00:00.000Z"),
        }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("e.g. Paris Nord"), {
      target: { value: "Lyon" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. LVMH"), {
      target: { value: "Renault" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Lyon", customer: "Renault" }),
      ),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("SHOULD call onOpenChange(false) WHEN cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(<SiteFormDialog open onOpenChange={onOpenChange} mode="create" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
