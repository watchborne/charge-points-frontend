import { NextRequest, NextResponse } from "next/server";

import { contactMessageSchema, type ContactMessage } from "@/lib/contact-message";
import { contactRateLimiter } from "@/lib/contact-rate-limit";
import { getClientIp } from "@/lib/rate-limit";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_RECIPIENT = "adrien.miquel.pro@gmail.com";
// Resend's shared test sender; set CONTACT_EMAIL_FROM to an address on a
// verified domain in any real environment.
const DEFAULT_SENDER = "Watchborne <onboarding@resend.dev>";

const buildBody = ({ company, name, email, phone, chargePoints, message }: ContactMessage) =>
  [
    `Nom : ${name}`,
    `Email : ${email}`,
    `Entreprise : ${company || "-"}`,
    `Téléphone : ${phone || "-"}`,
    `Nombre de bornes : ${chargePoints || "-"}`,
    "",
    message,
  ].join("\n");

// Public endpoint (the contact form is on a marketing page): not gated by
// proxy.ts, so it rate-limits itself. Sends the visitor's message by email through Resend's REST API.
// RESEND_API_KEY is server-side only — never give it a NEXT_PUBLIC_ prefix.
export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("contact: RESEND_API_KEY is not set");
    return NextResponse.json({ code: "NOT_CONFIGURED" }, { status: 500 });
  }

  const limit = contactRateLimiter.check(getClientIp(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = contactMessageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  }

  const contact = parsed.data;
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_EMAIL_FROM || DEFAULT_SENDER,
      to: [process.env.CONTACT_EMAIL_TO || DEFAULT_RECIPIENT],
      reply_to: contact.email,
      subject: `Nouveau message de contact — ${contact.name}`,
      text: buildBody(contact),
    }),
  });

  if (!response.ok) {
    console.error("contact: email provider error", response.status, await response.text());
    return NextResponse.json({ code: "SEND_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
