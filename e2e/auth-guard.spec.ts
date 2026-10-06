import { expect, test } from "@playwright/test";

test.describe("Auth guard", () => {
  test("SHOULD redirect to /login WHEN an anonymous visitor opens the dashboard", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Bon retour." })).toBeVisible();
  });

  test("SHOULD keep the locale prefix WHEN an anonymous English visitor opens the dashboard", async ({
    page,
  }) => {
    await page.goto("/en/app/dashboard");

    await expect(page).toHaveURL(/\/en\/login$/);
  });
});
