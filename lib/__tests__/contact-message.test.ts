import { describe, expect, it } from "vitest";

import { contactMessageSchema } from "../contact-message";

// charge-points-server pins the same cases against its own ContactBodySchema
// (schemas/__tests__/contact.test.ts). The two repositories each declare the
// body, so a case changed on one side must change on the other.
const BODY = { name: "Jane Doe", email: "jane@example.com", message: "Hello there" };

describe("contactMessageSchema (contract shared with the backend)", () => {
  it("SHOULD trim the email WHEN it has surrounding whitespace", () => {
    const parsed = contactMessageSchema.parse({ ...BODY, email: "  jane@example.com  " });

    expect(parsed.email).toBe("jane@example.com");
  });

  it.each(["jane@example", "jane@", "not an email", "   "])(
    "SHOULD reject the email WHEN it is %j",
    (email) => {
      expect(contactMessageSchema.safeParse({ ...BODY, email }).success).toBe(false);
    },
  );

  it.each(["en", "fr"])("SHOULD accept the locale WHEN it is %j", (locale) => {
    expect(contactMessageSchema.parse({ ...BODY, locale }).locale).toBe(locale);
  });

  it.each(["de", "EN", "en-US", ""])("SHOULD reject the locale WHEN it is %j", (locale) => {
    expect(contactMessageSchema.safeParse({ ...BODY, locale }).success).toBe(false);
  });

  it("SHOULD default the locale to fr AND the optional fields to empty WHEN they are omitted", () => {
    expect(contactMessageSchema.parse(BODY)).toEqual({
      ...BODY,
      company: "",
      phone: "",
      chargePoints: "",
      locale: "fr",
    });
  });
});
