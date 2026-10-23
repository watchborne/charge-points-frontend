import type { ContactMessageInput } from "./contact-message";
import { httpClient } from "./http-client";

export const contactApis = {
  // Emails the contact form (POST /api/contact, handled by this app).
  send: async function (input: ContactMessageInput): Promise<void> {
    await httpClient.post<{ ok: boolean }>("/api/contact", input);
  },
};
