import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useSearchParams } = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useSearchParams }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      otpExpired:
        "This sign-in link has expired or was already used. Please request a new one below.",
      generic: "Sign-in failed. Please try again.",
    };
    return translations[key] ?? key;
  },
}));

import { AuthErrorCallout } from "../AuthErrorCallout";

afterEach(() => {
  cleanup();
});

describe("AuthErrorCallout", () => {
  it("renders nothing when there is no error_code in the URL", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());

    const { container } = render(<AuthErrorCallout />);

    expect(container.textContent).toBe("");
  });

  it("shows the expired-link message for an otp_expired error", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error_code=otp_expired"));

    render(<AuthErrorCallout />);

    expect(
      screen.getByText(
        "This sign-in link has expired or was already used. Please request a new one below.",
      ),
    ).toBeTruthy();
  });

  it("falls back to the generic message for other error codes", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error_code=access_denied"));

    render(<AuthErrorCallout />);

    expect(screen.getByText("Sign-in failed. Please try again.")).toBeTruthy();
  });
});
