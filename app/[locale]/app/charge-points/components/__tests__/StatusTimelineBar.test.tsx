import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { StatusTone } from "@/lib/status";
import type { StatusSegment } from "@/lib/status-history";

import { StatusTimelineBar } from "../StatusTimelineBar";

// Radix's Tooltip (behind the shared Tooltip primitive) needs these in jsdom,
// same as every other Radix-based component tested in this codebase.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

type TestStatus = "Available" | "Charging";

const TONE_OF: Record<TestStatus, StatusTone> = {
  Available: "green",
  Charging: "blue",
};
const toneOf = (status: TestStatus) => TONE_OF[status];
const label = (status: TestStatus) => status;

const WINDOW_START = new Date("2026-08-10T00:00:00.000Z");
const WINDOW_END = new Date("2026-08-11T00:00:00.000Z"); // 24h window

const renderBar = (segments: StatusSegment<TestStatus>[]) =>
  render(
    <StatusTimelineBar
      segments={segments}
      windowStart={WINDOW_START}
      windowEnd={WINDOW_END}
      toneOf={toneOf}
      label={label}
      ariaLabel="Timeline"
      unknownLabel="No data"
    />,
  );

describe("StatusTimelineBar", () => {
  it("SHOULD render one block per segment, sized proportionally to its duration", () => {
    const { container } = renderBar([
      { status: "Available", start: WINDOW_START, end: new Date("2026-08-10T06:00:00.000Z") }, // 6h = 25%
      { status: "Charging", start: new Date("2026-08-10T06:00:00.000Z"), end: WINDOW_END }, // 18h = 75%
    ]);

    const blocks = container.querySelectorAll("[role='img'] > div");
    expect(blocks).toHaveLength(2);
    expect((blocks[0] as HTMLElement).style.width).toBe("25%");
    expect((blocks[1] as HTMLElement).style.width).toBe("75%");
  });

  it("SHOULD colour a real status via its tone, and a null segment as neutral", () => {
    const { container } = renderBar([
      { status: null, start: WINDOW_START, end: new Date("2026-08-10T06:00:00.000Z") },
      { status: "Available", start: new Date("2026-08-10T06:00:00.000Z"), end: WINDOW_END },
    ]);

    const blocks = container.querySelectorAll("[role='img'] > div");
    expect(blocks[0].className).toContain("bg-muted");
    expect(blocks[1].className).toContain("bg-green");
  });

  it("SHOULD name the bar for a screen reader via aria-label", () => {
    renderBar([{ status: "Available", start: WINDOW_START, end: WINDOW_END }]);

    expect(screen.getByRole("img", { name: "Timeline" })).toBeDefined();
  });

  it("SHOULD put the status, bounds and duration in each block's tooltip", async () => {
    const end = new Date("2026-08-10T02:30:00.000Z");
    const { container } = renderBar([{ status: "Charging", start: WINDOW_START, end }]);

    // Radix's Tooltip only mounts its content once open — focus is the
    // keyboard-equivalent trigger (no hover delay, unlike a pointer hover).
    const block = container.querySelector("[role='img'] > div") as HTMLElement;
    fireEvent.focus(block);

    const tooltip = await screen.findByRole("tooltip");
    // Formatted with the runner's own local timezone (date-fns's default),
    // matching how the component itself formats — not a hardcoded wall-clock
    // string, which would only pass in UTC.
    expect(tooltip.textContent).toBe(
      `Charging · ${format(WINDOW_START, "dd/MM HH:mm")} → ${format(end, "dd/MM HH:mm")} (2h30m)`,
    );
  });

  it("SHOULD use the unknown label in a null segment's tooltip", async () => {
    const { container } = renderBar([{ status: null, start: WINDOW_START, end: WINDOW_END }]);

    const block = container.querySelector("[role='img'] > div") as HTMLElement;
    fireEvent.focus(block);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toContain("No data");
  });

  it("SHOULD keep each block focusable and named for a screen reader via aria-label", () => {
    const end = new Date("2026-08-10T02:30:00.000Z");
    const { container } = renderBar([{ status: "Charging", start: WINDOW_START, end }]);

    const block = container.querySelector("[role='img'] > div") as HTMLElement;
    expect(block.tabIndex).toBe(0);
    expect(block.getAttribute("aria-label")).toBe(
      `Charging · ${format(WINDOW_START, "dd/MM HH:mm")} → ${format(end, "dd/MM HH:mm")} (2h30m)`,
    );
  });

  it("SHOULD list each status once in the legend, in first-appearance order", () => {
    renderBar([
      { status: "Charging", start: WINDOW_START, end: new Date("2026-08-10T06:00:00.000Z") },
      {
        status: "Available",
        start: new Date("2026-08-10T06:00:00.000Z"),
        end: new Date("2026-08-10T12:00:00.000Z"),
      },
      { status: "Charging", start: new Date("2026-08-10T12:00:00.000Z"), end: WINDOW_END },
    ]);

    const legendLabels = screen.getAllByText(/^(Charging|Available)$/).map((el) => el.textContent);
    expect(legendLabels).toEqual(["Charging", "Available"]);
  });

  it("SHOULD render no legend WHEN every segment is unknown", () => {
    renderBar([{ status: null, start: WINDOW_START, end: WINDOW_END }]);

    expect(screen.queryByText("No data")).toBeNull();
  });
});
