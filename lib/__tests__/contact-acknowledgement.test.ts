import { describe, expect, it } from "vitest";

import { buildContactAcknowledgement } from "../contact-acknowledgement";

describe("buildContactAcknowledgement", () => {
  it("SHOULD write in English WHEN the locale is en", () => {
    const { subject, text } = buildContactAcknowledgement("Jane", "en");

    expect(subject).toBe("We have received your message");
    expect(text).toContain("Hello Jane,");
  });

  it("SHOULD write in French WHEN the locale is fr", () => {
    expect(buildContactAcknowledgement("Jane", "fr").text).toContain("Bonjour Jane,");
  });

  it("SHOULD fall back to French WHEN the locale is unknown", () => {
    expect(buildContactAcknowledgement("Jane", "de").subject).toBe(
      "Nous avons bien reçu votre message",
    );
  });

  it("SHOULD keep a name with ICU syntax literal WHEN it contains braces", () => {
    const { text } = buildContactAcknowledgement("{evil, plural, other{x}}", "en");

    expect(text).toContain("Hello {evil, plural, other{x}},");
  });
});
