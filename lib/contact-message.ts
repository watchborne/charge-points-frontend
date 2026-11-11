import { z } from "zod";

import { defaultLocale, locales } from "@/i18n/locale";

// Shared by the contact form (client) and the /api/contact route (server), so
// both sides agree on what a valid submission is.
export const contactMessageSchema = z.object({
  company: z.string().trim().max(200).optional().default(""),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().default(""),
  chargePoints: z.string().trim().max(50).optional().default(""),
  message: z.string().trim().min(1).max(5000),
  // Language of the page the form was sent from; the acknowledgement is written in it.
  locale: z.enum(locales).optional().default(defaultLocale),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessage = z.output<typeof contactMessageSchema>;
