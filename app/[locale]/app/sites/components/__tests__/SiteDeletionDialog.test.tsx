import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Site } from "@watchborne/charge-points-types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { SiteDeletionDialog } from "../SiteDeletionDialog";

afterEach(() => cleanup());

const site: Site = {
  id: "site-1",
  name: "Paris Nord",
  customer: "LVMH",
  customerId: "c-1",
  installedAt: new Date(),
  lastVisitedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as Site;

describe("SiteDeletionDialog", () => {
  it("SHOULD render nothing open WHEN deleteTarget is null", () => {
    render(
      <SiteDeletionDialog
        open={false}
        deleteTarget={null}
        onOpenChange={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.queryByText("This cannot be undone.")).toBeNull();
  });

  it("SHOULD show the site's name in the confirmation title WHEN a target is set", () => {
    render(
      <SiteDeletionDialog
        open
        deleteTarget={site}
        onOpenChange={vi.fn()}
        onDeleteClicked={vi.fn()}
      />,
    );

    expect(screen.getByText("Delete Paris Nord?")).toBeTruthy();
  });

  it("SHOULD call onDeleteClicked WHEN the destructive action is confirmed", () => {
    const onDeleteClicked = vi.fn();
    render(
      <SiteDeletionDialog
        open
        deleteTarget={site}
        onOpenChange={vi.fn()}
        onDeleteClicked={onDeleteClicked}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDeleteClicked).toHaveBeenCalled();
  });

  it("SHOULD call onOpenChange(false) WHEN cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <SiteDeletionDialog
        open
        deleteTarget={site}
        onOpenChange={onOpenChange}
        onDeleteClicked={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
