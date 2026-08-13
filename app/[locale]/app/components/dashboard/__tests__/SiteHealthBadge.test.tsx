import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { SiteHealthBadge } from "../SiteHealthBadge";

afterEach(() => cleanup());

describe("SiteHealthBadge", () => {
  it.each([
    ["HEALTHY", "appPage.dashboard.siteHealth.status.healthy"],
    ["DEGRADED", "appPage.dashboard.siteHealth.status.degraded"],
    ["CRITICAL", "appPage.dashboard.siteHealth.status.critical"],
  ] as const)("SHOULD render the label for %s", (status, expectedKey) => {
    render(<SiteHealthBadge status={status} />);

    expect(screen.getByText(expectedKey)).toBeTruthy();
  });
});
