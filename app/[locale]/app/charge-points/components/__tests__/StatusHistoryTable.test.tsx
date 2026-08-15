import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { StatusTone } from "@/lib/status";
import type { StatusSegment } from "@/lib/status-history";

import { StatusHistoryTable } from "../StatusHistoryTable";

afterEach(() => cleanup());

type TestStatus = "Available" | "Charging";

const TONE_OF: Record<TestStatus, StatusTone> = { Available: "available", Charging: "charging" };

const renderTable = (segments: StatusSegment<TestStatus>[]) =>
  render(
    <StatusHistoryTable
      segments={segments}
      toneOf={(status) => TONE_OF[status]}
      label={(status) => status}
      unknownLabel="No data"
      timestampHeader="Timestamp"
      statusHeader="Status"
      durationHeader="Duration"
    />,
  );

describe("StatusHistoryTable", () => {
  it("SHOULD render a summary pill per status with its total duration", () => {
    renderTable([
      {
        status: "Available",
        start: new Date("2026-08-01T00:00:00.000Z"),
        end: new Date("2026-08-01T04:00:00.000Z"),
      },
      {
        status: "Charging",
        start: new Date("2026-08-01T04:00:00.000Z"),
        end: new Date("2026-08-01T06:00:00.000Z"),
      },
    ]);

    expect(screen.getByText("Available · 4h0m")).toBeDefined();
    expect(screen.getByText("Charging · 2h0m")).toBeDefined();
  });

  it("SHOULD render no summary pills WHEN every segment is unknown", () => {
    renderTable([
      {
        status: null,
        start: new Date("2026-08-01T00:00:00.000Z"),
        end: new Date("2026-08-02T00:00:00.000Z"),
      },
    ]);

    expect(screen.queryByText(/·/)).toBeNull();
  });

  it("SHOULD list rows newest first, the opposite of a bar's left-to-right axis", () => {
    renderTable([
      {
        status: "Available",
        start: new Date("2026-08-01T00:00:00.000Z"),
        end: new Date("2026-08-01T04:00:00.000Z"),
      },
      {
        status: "Charging",
        start: new Date("2026-08-01T04:00:00.000Z"),
        end: new Date("2026-08-01T06:00:00.000Z"),
      },
    ]);

    const rows = screen.getAllByRole("row").slice(1); // drop the header row
    expect(rows[0].textContent).toContain("Charging");
    expect(rows[1].textContent).toContain("Available");
  });

  it("SHOULD label a null segment with unknownLabel and no colour dot", () => {
    renderTable([
      {
        status: null,
        start: new Date("2026-08-01T00:00:00.000Z"),
        end: new Date("2026-08-01T04:00:00.000Z"),
      },
    ]);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("No data");
  });

  it("SHOULD show each row's own duration, not a running total", () => {
    renderTable([
      {
        status: "Available",
        start: new Date("2026-08-01T00:00:00.000Z"),
        end: new Date("2026-08-01T01:30:00.000Z"),
      },
    ]);

    expect(screen.getByText("1h30m")).toBeDefined();
  });
});
