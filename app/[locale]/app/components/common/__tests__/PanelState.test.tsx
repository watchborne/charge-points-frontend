import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PanelState } from "../PanelState";

afterEach(() => cleanup());

const renderState = (props: Partial<React.ComponentProps<typeof PanelState>> = {}) =>
  render(
    <PanelState
      loadingMessage="Loading…"
      errorMessage="Could not load."
      emptyMessage="Nothing here."
      {...props}
    >
      <p>Content</p>
    </PanelState>,
  );

describe("PanelState", () => {
  it("SHOULD render the content WHEN it is not loading, failed or empty", () => {
    renderState();

    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.queryByText("Loading…")).toBeNull();
    expect(screen.queryByText("Could not load.")).toBeNull();
    expect(screen.queryByText("Nothing here.")).toBeNull();
  });

  it("SHOULD render only the loading message WHEN isLoading is set", () => {
    renderState({ isLoading: true });

    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(screen.queryByText("Content")).toBeNull();
  });

  it("SHOULD render the loading message INSTEAD OF the error WHEN both are set", () => {
    renderState({ isLoading: true, isError: true });

    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(screen.queryByText("Could not load.")).toBeNull();
  });

  it("SHOULD render the given icon WHEN loadingIcon is set", () => {
    renderState({ isLoading: true, loadingIcon: <svg data-testid="custom-icon" /> });

    expect(screen.getByTestId("custom-icon")).toBeTruthy();
  });

  it("SHOULD render the error message INSTEAD OF the content WHEN isError is set", () => {
    renderState({ isError: true });

    expect(screen.getByText("Could not load.")).toBeTruthy();
    expect(screen.queryByText("Content")).toBeNull();
  });

  it("SHOULD render the error message INSTEAD OF the empty one WHEN both are set", () => {
    renderState({ isError: true, isEmpty: true });

    expect(screen.getByText("Could not load.")).toBeTruthy();
    expect(screen.queryByText("Nothing here.")).toBeNull();
  });

  it("SHOULD render the empty message INSTEAD OF the content WHEN isEmpty is set", () => {
    renderState({ isEmpty: true });

    expect(screen.getByText("Nothing here.")).toBeTruthy();
    expect(screen.queryByText("Content")).toBeNull();
  });

  it("SHOULD render nothing WHEN isEmpty is set without an empty message", () => {
    const { container } = renderState({ isEmpty: true, emptyMessage: undefined });

    expect(container.innerHTML).toBe("");
  });
});
