import { NextRequest, NextResponse } from "next/server";

import { buildContactAcknowledgement } from "@/lib/contact-acknowledgement";
import { contactMessageSchema, type ContactMessage } from "@/lib/contact-message";
import { contactRateLimiter } from "@/lib/contact-rate-limit";
import { getClientIp } from "@/lib/rate-limit";
import { reportError } from "@/lib/report-error";

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

const sendEmail = (apiKey: string, email: Record<string, unknown>) =>
  fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.CONTACT_EMAIL_FROM || DEFAULT_SENDER, ...email }),
  });

// The message is already delivered to the team by the time this runs, so a failed
// acknowledgement is reported but never turned into an error for the visitor.
const acknowledge = async (apiKey: string, { name, email, locale }: ContactMessage) => {
  const { subject, text } = buildContactAcknowledgement(name, locale);
  const replyTo = process.env.CONTACT_EMAIL_REPLY_TO;
  try {
    const response = await sendEmail(apiKey, {
      to: [email],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });
    if (!response.ok) {
      throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    reportError(error, "contact.acknowledge");
  }
};

// Public and handled here, not by the backend, so it rate-limits itself, then
// emails the message through Resend. RESEND_API_KEY is server-side only.
export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    reportError(new Error("RESEND_API_KEY is not set"), "contact.config");
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
  const response = await sendEmail(apiKey, {
    to: [process.env.CONTACT_EMAIL_TO || DEFAULT_RECIPIENT],
    reply_to: contact.email,
    subject: `Nouveau message de contact — ${contact.name}`,
    text: buildBody(contact),
  });

  if (!response.ok) {
    reportError(
      new Error(`Resend answered ${response.status}: ${await response.text()}`),
      "contact.send",
    );
    return NextResponse.json({ code: "SEND_FAILED" }, { status: 502 });
  }

  await acknowledge(apiKey, contact);

  return NextResponse.json({ ok: true });
}
