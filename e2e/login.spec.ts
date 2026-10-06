import { expect, test, type Page } from "@playwright/test";

const EMAIL = "installer@example.com";

// `LoginForm` first asks the backend (via the Next proxy) whether the email may
// sign in, then asks Supabase to email a code. Both are stubbed so the spec
// exercises the UI flow without any backend.
const stubAccessCheck = (page: Page, body: object, status = 200) =>
  page.route("**/api/access-requests/check-login", (route) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }),
  );

const stubSupabaseOtp = (page: Page, status = 200, body: object = {}) =>
  page.route("**/auth/v1/otp*", (route) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }),
  );

const submitEmail = async (page: Page) => {
  await page.goto("/login");
  const emailInput = page.getByLabel("Adresse email");
  // The inputs are controlled: a value typed before React hydrates is wiped when
  // it does, so retry until the value sticks.
  await expect(async () => {
    await emailInput.fill(EMAIL);
    await expect(emailInput).toHaveValue(EMAIL);
  }).toPass();
  await page.getByRole("button", { name: "Envoyer le code" }).click();
};

test.describe("Login", () => {
  test("SHOULD show the OTP step WHEN the email is allowed and the code is sent", async ({
    page,
  }) => {
    await stubAccessCheck(page, {});
    await stubSupabaseOtp(page);

    await submitEmail(page);

    await expect(page.getByLabel("Code de vérification")).toBeVisible();
    await expect(page.getByText(EMAIL)).toBeVisible();
  });

  test("SHOULD go back to the email step WHEN the user changes address", async ({ page }) => {
    await stubAccessCheck(page, {});
    await stubSupabaseOtp(page);

    await submitEmail(page);
    await page.getByRole("button", { name: "Utiliser une autre adresse" }).click();

    await expect(page.getByLabel("Adresse email")).toBeVisible();
  });

  test("SHOULD explain the request is pending WHEN access is not yet approved", async ({
    page,
  }) => {
    await stubAccessCheck(page, { code: "ACCESS_PENDING" }, 202);

    await submitEmail(page);

    await expect(page.getByText("est en cours d'examen")).toBeVisible();
    await expect(page.getByLabel("Code de vérification")).toHaveCount(0);
  });

  test("SHOULD reject the email WHEN it was never invited", async ({ page }) => {
    await stubAccessCheck(page, { code: "NOT_INVITED" }, 403);

    await submitEmail(page);

    await expect(page.getByText("Aucun compte n'est associé à cette adresse email")).toBeVisible();
  });

  test("SHOULD show a generic error WHEN Supabase fails to send the code", async ({ page }) => {
    await stubAccessCheck(page, {});
    await stubSupabaseOtp(page, 500, { code: "unexpected_failure", msg: "boom" });

    await submitEmail(page);

    await expect(page.getByText("Impossible d'envoyer le code")).toBeVisible();
  });

  test("SHOULD show an invalid-code error WHEN verifyOtp is rejected", async ({ page }) => {
    await stubAccessCheck(page, {});
    await stubSupabaseOtp(page);
    await page.route("**/auth/v1/verify*", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ code: 403, error_code: "otp_expired", msg: "expired" }),
      }),
    );

    await submitEmail(page);
    await page.getByLabel("Code de vérification").fill("12345678");
    await page.getByRole("button", { name: "Vérifier" }).click();

    await expect(page.getByText("Ce code est invalide ou a expiré")).toBeVisible();
  });
});
