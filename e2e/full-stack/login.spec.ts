import { expect, test } from "@playwright/test";

// Runs against a real backend (GHCR image, PERSISTENCE=memory seeded fleet) and a
// real local Supabase — see .github/workflows/e2e-full-stack.yml, which also
// creates the user and grants them the seeded fleet (SEED_MEMBERSHIP_USER_ID).
const EMAIL = process.env.E2E_USER_EMAIL;
const USER_ID = process.env.E2E_USER_ID;

test.describe("Login (full stack)", () => {
  test.skip(
    !EMAIL || !USER_ID,
    "E2E_USER_EMAIL / E2E_USER_ID are provided by the nightly workflow",
  );

  test("SHOULD land on the dashboard with the caller's scoped fleet WHEN signing in with a real OTP", async ({
    page,
  }) => {
    await page.goto("/login");

    // The dev shortcut mints a real OTP via the Supabase admin API and runs the
    // same client-side `verifyOtp` a user's browser would. The input is controlled,
    // so retry the fill until it survives hydration.
    const devEmail = page.locator('input[name="email"]');
    await expect(async () => {
      await devEmail.fill(EMAIL!);
      await expect(devEmail).toHaveValue(EMAIL!);
    }).toPass();
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/app\/dashboard$/, { timeout: 30_000 });

    // The proxy forwards the session's bearer token: the backend resolving this
    // user's scope proves the whole Supabase -> frontend -> backend chain.
    const response = await page.request.get("/api/me");
    expect(response.status()).toBe(200);
    const me = await response.json();
    expect(me.userId).toBe(USER_ID);
    expect(me.chargePoints.length).toBeGreaterThan(0);
  });
});
