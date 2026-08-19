import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteGridSkeleton } from "../SiteGridSkeleton";

afterEach(() => cleanup());

describe("SiteGridSkeleton", () => {
  it("SHOULD render six placeholder cards", () => {
    const { container } = render(<SiteGridSkeleton />);

    expect(container.querySelectorAll(":scope > div > div").length).toBe(6);
  });
});
