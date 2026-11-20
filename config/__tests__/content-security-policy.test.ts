import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, sentryEndpoints } from "../content-security-policy";

const BASE = {
  apiUrl: "https://api.example.test",
  wsUrl: "wss://api.example.test/ws",
  supabaseUrl: "https://abc.supabase.co",
  sentryDsn: "",
};

const DSN = "https://publickey@o123.ingest.sentry.io/456";

const directive = (policy: string, name: string) =>
  policy
    .split("; ")
    .find((part) => part === name || part.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("buildContentSecurityPolicy", () => {
  it("SHOULD allow only the origins the browser talks to in connect-src", () => {
    const policy = buildContentSecurityPolicy(BASE);

    expect(directive(policy, "connect-src")).toEqual([
      "'self'",
      "https://api.example.test",
      "wss://api.example.test",
      "https://abc.supabase.co",
    ]);
  });

  it("SHOULD NOT report violations WHEN there is no Sentry DSN", () => {
    expect(directive(buildContentSecurityPolicy(BASE), "report-uri")).toBeUndefined();
  });

  it("SHOULD report violations to Sentry's security endpoint WHEN a DSN is set", () => {
    const policy = buildContentSecurityPolicy({ ...BASE, sentryDsn: DSN });

    expect(directive(policy, "report-uri")).toEqual([
      "https://o123.ingest.sentry.io/api/456/security/?sentry_key=publickey",
    ]);
  });

  it("SHOULD allow Sentry's ingest origin in connect-src WHEN a DSN is set", () => {
    // Enforcing without it would silently block every error report.
    const policy = buildContentSecurityPolicy({ ...BASE, sentryDsn: DSN });

    expect(directive(policy, "connect-src")).toContain("https://o123.ingest.sentry.io");
  });

  it("SHOULD list an origin once WHEN several settings share it", () => {
    const policy = buildContentSecurityPolicy({ ...BASE, apiUrl: "https://abc.supabase.co" });

    const origins = directive(policy, "connect-src") ?? [];
    expect(origins.filter((origin) => origin === "https://abc.supabase.co")).toHaveLength(1);
  });

  it("SHOULD drop an unset or malformed origin", () => {
    const policy = buildContentSecurityPolicy({ ...BASE, supabaseUrl: "", wsUrl: "not a url" });

    expect(directive(policy, "connect-src")).toEqual(["'self'", "https://api.example.test"]);
  });

  it("SHOULD keep the framing and form restrictions", () => {
    const policy = buildContentSecurityPolicy(BASE);

    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(policy, "base-uri")).toEqual(["'self'"]);
    expect(directive(policy, "form-action")).toEqual(["'self'"]);
  });
});

describe("sentryEndpoints", () => {
  it("SHOULD return null WHEN the DSN is empty, malformed or has no project", () => {
    expect(sentryEndpoints("")).toBeNull();
    expect(sentryEndpoints("not a dsn")).toBeNull();
    expect(sentryEndpoints("https://o123.ingest.sentry.io/")).toBeNull();
  });
});
