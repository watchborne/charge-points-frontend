import type { ContactMessageInput } from "./contact-message";
import { httpClient } from "./http-client";

export const contactApis = {
  // Sends the contact form's content by email (POST /api/contact, a public
  // route handled by this app itself — not proxied to charge-points-server).
  send: async function (input: ContactMessageInput): Promise<void> {
    await httpClient.post<{ ok: boolean }>("/api/contact", input);
  },
};
