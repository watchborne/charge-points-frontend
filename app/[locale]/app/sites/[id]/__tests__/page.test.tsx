import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stable references: the page re-derives state in an effect keyed on `sites`, so a fresh
// array per render would loop forever.
const { updateSite, pushErrorNotification, site, sitesResult, chargePointsResult } = vi.hoisted(
  () => {
    const site = {
      id: "site-1",
      name: "Paris",
      customer: "ACME",
      installedAt: new Date("2025-01-01"),
    };
    return {
      updateSite: vi.fn(),
      pushErrorNotification: vi.fn(),
      site,
      sitesResult: { sites: [site], loading: false, error: null },
      chargePointsResult: { chargePoints: [] },
    };
  },
);

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "site-1" }) }));
vi.mock("../../../../../../i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children }: { children: ReactNode }): ReactNode => children,
}));
vi.mock("../../../../../../lib/api", () => ({ api: { Sites: { updateSite } } }));
vi.mock("../../../../../components/ToastNotification", () => ({
  useToastNotification: () => ({ pushErrorNotification }),
}));
vi.mock("../../../hooks/useSites", () => ({ useSites: () => sitesResult }));
vi.mock("../../../hooks/useChargePoints", () => ({ useChargePoints: () => chargePointsResult }));
vi.mock("../../components/SiteDeletionDialog", () => ({ SiteDeletionDialog: () => null }));
// Stand-ins for the children: the detail view exposes the "edit" entry point, and the
// edit dialog a button that submits fixed values (only rendered while open).
vi.mock("../../components/SiteDetail", () => ({
  SiteDetail: ({ onEditClicked }: { onEditClicked: (s: typeof site) => void }): ReactNode => (
    <button onClick={() => onEditClicked(site)}>open-edit</button>
  ),
}));
vi.mock("../../components/SiteFormDialog", () => ({
  SiteFormDialog: ({
    mode,
    open,
    onSubmit,
  }: {
    mode: string;
    open: boolean;
    onSubmit: (values: unknown) => void;
  }): ReactNode =>
    mode === "edit" && open ? (
      <button onClick={() => onSubmit({ name: "Lyon", customer: "ACME", installedAt: new Date() })}>
        submit-edit
      </button>
    ) : null,
}));

import SiteDetailPage from "../page";

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <SiteDetailPage />
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("SiteDetailPage edit flow", () => {
  it("SHOULD call updateSite and close the dialog WHEN the edit form is submitted", async () => {
    updateSite.mockResolvedValue(site);
    renderPage();

    fireEvent.click(screen.getByText("open-edit"));
    fireEvent.click(screen.getByText("submit-edit"));

    await waitFor(() => expect(screen.queryByText("submit-edit")).toBeNull());
    expect(updateSite).toHaveBeenCalledWith(
      "site-1",
      expect.objectContaining({ id: "site-1", name: "Lyon", customer: "ACME" }),
    );
    expect(pushErrorNotification).not.toHaveBeenCalled();
  });

  it("SHOULD notify the user and keep the dialog open WHEN updating a site fails", async () => {
    updateSite.mockRejectedValue(new Error("boom"));
    renderPage();

    fireEvent.click(screen.getByText("open-edit"));
    fireEvent.click(screen.getByText("submit-edit"));

    await waitFor(() =>
      expect(pushErrorNotification).toHaveBeenCalledWith("appPage.sites.errors.updateFailed"),
    );
    expect(screen.getByText("submit-edit")).toBeTruthy();
  });
});
