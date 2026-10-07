import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The effective preference charge-points-server's
// /api/me/notification-preferences route returns — not a domain entity, so
// it isn't part of @watchborne/charge-points-types (same reasoning as
// lib/api-me.ts's `Me`). `digestHourUtc` is always a resolved 0-23 value:
// the backend already substitutes its own global default when the caller
// has never set one, so this client never needs to know about that fallback.
// `locale` is resolved the same way (the language of the emails the backend
// sends this user — charge-points-server ADR 0022): never null in a response.
// `digestEmailEnabled`/`digestPushEnabled` are independent per-channel toggles
// (charge-points-server ADR 0023) — either, both or neither can be on at
// once; `digestHourUtc` applies to whichever channel(s) are enabled.
export type EmailLocale = "fr" | "en";

export type NotificationPreferences = {
  digestEmailEnabled: boolean;
  digestPushEnabled: boolean;
  digestHourUtc: number;
  locale: EmailLocale;
};

export type NotificationPreferencesUpdate = Partial<NotificationPreferences>;

export const notificationPreferencesApis = {
  getPreferences: async function (): Promise<NotificationPreferences> {
    return withErrorLogging(
      () => httpClient.get<NotificationPreferences>("/api/me/notification-preferences"),
      "NotificationPreferences.getPreferences",
    );
  },

  updatePreferences: async function (
    update: NotificationPreferencesUpdate,
  ): Promise<NotificationPreferences> {
    return withErrorLogging(
      () => httpClient.patch<NotificationPreferences>("/api/me/notification-preferences", update),
      "NotificationPreferences.updatePreferences",
    );
  },
};
