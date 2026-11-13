import { z } from "zod";

// What the contact form submits to /api/contact. charge-points-server declares
// the same body: keep the rules (trimmed email, "en" | "fr" locale) identical on
// both sides. The locale list is spelled out rather than derived from
// i18n/locale, so adding a UI locale cannot make this accept a value the backend
// rejects.
export const contactMessageSchema = z.object({
  company: z.string().trim().max(200).optional().default(""),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().default(""),
  // A count, not free text: a browser autofilling the wrong field (a first
  // name, say) must be rejected rather than reach the inbox mislabeled.
  chargePoints: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/)
    .or(z.literal(""))
    .optional()
    .default(""),
  message: z.string().trim().min(1).max(5000),
  // Language of the page the form was sent from; the acknowledgement is written in it.
  locale: z.enum(["en", "fr"]).optional().default("fr"),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessage = z.output<typeof contactMessageSchema>;
