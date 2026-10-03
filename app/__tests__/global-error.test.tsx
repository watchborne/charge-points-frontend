import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException }));

import GlobalError from "../global-error";

describe("GlobalError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("SHOULD report the error to Sentry WHEN rendered", () => {
    const error = new Error("render crashed");

    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(captureException).toHaveBeenCalledWith(error);
  });

  it("SHOULD call reset WHEN the retry button is clicked", () => {
    const reset = vi.fn();

    render(<GlobalError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button"));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
