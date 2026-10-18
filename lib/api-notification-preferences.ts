import type {
  NotificationLocale,
  NotificationPreferences,
  UpdateNotificationPreferences,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

export type { NotificationPreferences };

// The effective preference charge-points-server's
// /api/me/notification-preferences route returns, and the partial update it
// accepts — both shared through @watchborne/charge-points-types. `digestHour` is
// always a resolved 0-23 value: the backend already substitutes its own global
// default when the caller has never set one, so this client never needs to know
// about that fallback. `locale` is resolved the same way (the language of the
// emails the backend sends this user — charge-points-server ADR 0022): never null
// in a response, while an update may send `locale: null` to revert to the default.
// `digestEmailEnabled`/`digestPushEnabled` are independent per-channel toggles
// (charge-points-server ADR 0023) — either, both or neither can be on at once;
// `digestHour` applies to whichever channel(s) are enabled.
export type EmailLocale = NotificationLocale;

export type NotificationPreferencesUpdate = UpdateNotificationPreferences;

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
