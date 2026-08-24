import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { SiteFormDialog } from "../SiteFormDialog";

afterEach(() => cleanup());

describe("SiteFormDialog", () => {
  it("SHOULD show the create title and submit label WHEN mode is create", () => {
    render(<SiteFormDialog open onOpenChange={vi.fn()} mode="create" onSubmit={vi.fn()} />);

    expect(screen.getByText("appPage.sites.form.createTitle")).toBeTruthy();
    expect(screen.getByRole("button", { name: "appPage.sites.form.buttons.create" })).toBeTruthy();
  });

  it("SHOULD show the edit title and submit label WHEN mode is edit", () => {
    render(<SiteFormDialog open onOpenChange={vi.fn()} mode="edit" onSubmit={vi.fn()} />);

    expect(screen.getByText("appPage.sites.form.editTitle")).toBeTruthy();
    expect(screen.getByRole("button", { name: "appPage.sites.form.buttons.save" })).toBeTruthy();
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

    expect(
      screen.getByPlaceholderText("appPage.sites.form.fields.siteNamePlaceholder"),
    ).toHaveProperty("value", "Paris Nord");
    expect(
      screen.getByPlaceholderText("appPage.sites.form.fields.customerNamePlaceholder"),
    ).toHaveProperty("value", "LVMH");
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

    fireEvent.change(screen.getByPlaceholderText("appPage.sites.form.fields.siteNamePlaceholder"), {
      target: { value: "Lyon" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("appPage.sites.form.fields.customerNamePlaceholder"),
      {
        target: { value: "Renault" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "appPage.sites.form.buttons.create" }));

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

    fireEvent.click(screen.getByRole("button", { name: "appPage.sites.form.buttons.cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
