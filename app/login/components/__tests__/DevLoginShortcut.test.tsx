import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DevLoginShortcut } from "../DevLoginShortcut";

afterEach(() => {
  cleanup();
});

describe("DevLoginShortcut", () => {
  it("SHOULD submit to /auth/dev-login via GET WHEN rendered", () => {
    render(<DevLoginShortcut />);

    const form = screen.getByRole("textbox").closest("form") as HTMLFormElement;

    expect(form.getAttribute("action")).toBe("/auth/dev-login");
    expect(form.method).toBe("get");
  });

  it("SHOULD render a required email input named 'email' and a submit button", () => {
    render(<DevLoginShortcut />);

    const input = screen.getByRole("textbox") as HTMLInputElement;

    expect(input.type).toBe("email");
    expect(input.name).toBe("email");
    expect(input.required).toBe(true);
    expect((screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement).type).toBe(
      "submit",
    );
  });
});
