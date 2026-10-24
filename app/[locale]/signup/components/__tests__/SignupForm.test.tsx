import * as Sentry from "@sentry/nextjs";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requestAccess } = vi.hoisted(() => ({ requestAccess: vi.fn() }));

vi.mock("../../../../../lib/api", () => ({
  api: { AccessRequests: { requestAccess } },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "signupPage.form.email": "Email address",
      "signupPage.form.emailPlaceholder": "you@example.com",
      "signupPage.form.submit": "Request access",
      "signupPage.confirmation.error": "Couldn't submit your request. Please try again.",
    };
    return translations[key] ?? key;
  },
}));

import { HttpError } from "../../../../../lib/http-error";
import { SignupForm } from "../SignupForm";

const onFormSubmitted = vi.fn();

const submit = () => {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "user@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Request access" }));
};

beforeEach(() => {
  vi.mocked(Sentry.captureException).mockClear();
  requestAccess.mockReset();
  onFormSubmitted.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("SignupForm", () => {
  it("SHOULD submit the access request and notify the parent WHEN the form is submitted", async () => {
    requestAccess.mockResolvedValue(undefined);
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    submit();

    await waitFor(() => expect(onFormSubmitted).toHaveBeenCalledWith("user@example.com"));
    expect(requestAccess).toHaveBeenCalledWith({ email: "user@example.com", locale: "fr" });
  });

  it("SHOULD show the translated error and stay on the form WHEN the request fails", async () => {
    requestAccess.mockRejectedValue(new Error("HTTP error! status: 500"));
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    submit();

    await waitFor(() =>
      expect(screen.getByText("Couldn't submit your request. Please try again.")).toBeTruthy(),
    );
    expect(onFormSubmitted).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { context: "SignupForm.requestAccess" },
    });
  });

  // A rate-limited or rejected request is an answer the form already shows.
  it("SHOULD NOT report to Sentry WHEN the backend answers 4xx", async () => {
    requestAccess.mockRejectedValue(new HttpError(429, { code: "RATE_LIMITED" }));
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    submit();

    await waitFor(() =>
      expect(screen.getByText("Couldn't submit your request. Please try again.")).toBeTruthy(),
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("SHOULD disable the submit button WHILE the request is in flight", async () => {
    let resolveRequest: (value: undefined) => void = () => {};
    requestAccess.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    submit();

    expect(
      (screen.getByRole("button", { name: "Request access" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveRequest(undefined);
    await waitFor(() => expect(onFormSubmitted).toHaveBeenCalledWith("user@example.com"));
  });
});
