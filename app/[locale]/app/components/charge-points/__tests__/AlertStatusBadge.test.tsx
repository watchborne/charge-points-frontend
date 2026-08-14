import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { AlertStatusBadge } from "../AlertStatusBadge";

afterEach(() => cleanup());

describe("AlertStatusBadge", () => {
  it.each([
    ["OPEN", "appPage.chargePoints.alerts.status.open"],
    ["RESOLVED", "appPage.chargePoints.alerts.status.resolved"],
  ] as const)("SHOULD render the label for %s", (status, expectedKey) => {
    render(<AlertStatusBadge status={status} />);

    expect(screen.getByText(expectedKey)).toBeTruthy();
  });
});
