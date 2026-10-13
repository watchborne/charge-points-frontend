import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CsvExportButton } from "../CsvExportButton";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CsvExportButton", () => {
  it("SHOULD download a CSV file named after the filename WHEN clicked", () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const getRows = vi.fn(() => [["a", "b"]]);

    render(<CsvExportButton getRows={getRows} filename="export.csv" />);
    fireEvent.click(screen.getByRole("button", { name: "common.exportCsv" }));

    expect(getRows).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });

  it("SHOULD not download WHEN disabled", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<CsvExportButton getRows={() => []} filename="export.csv" disabled />);
    fireEvent.click(screen.getByRole("button"));

    expect(click).not.toHaveBeenCalled();
  });
});
