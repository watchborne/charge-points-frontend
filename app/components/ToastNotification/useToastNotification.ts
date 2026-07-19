import { toast, type ExternalToast } from "sonner";

import type {
  PushNotificationOptions,
  ToastNotificationApi,
  ToastNotificationContent,
  ToastNotificationOptions,
  ToastNotificationType,
} from "./toast-notification.types";

function toSonnerOptions(options: ToastNotificationOptions): ExternalToast {
  const sonnerOptions: ExternalToast = {};

  if (options.disappearInMs !== undefined) {
    sonnerOptions.duration = options.disappearInMs;
  }

  if (options.dismissible !== undefined) {
    sonnerOptions.dismissible = options.dismissible;
    sonnerOptions.closeButton = options.dismissible;
  }

  return sonnerOptions;
}

function pushNotification(
  content: ToastNotificationContent,
  options: PushNotificationOptions,
): string | number {
  const { type, ...notificationOptions } = options;
  const sonnerOptions = toSonnerOptions(notificationOptions);

  const notificationByType: Record<ToastNotificationType, () => string | number> = {
    success: () => toast.success(content, sonnerOptions),
    error: () => toast.error(content, sonnerOptions),
  };

  return notificationByType[type]();
}

export const useToastNotification = (): ToastNotificationApi => ({
  pushNotification,

  pushSuccessNotification: (
    content: ToastNotificationContent,
    options: ToastNotificationOptions = {},
  ) =>
    pushNotification(content, {
      ...options,
      type: "success",
    }),

  pushErrorNotification: (
    content: ToastNotificationContent,
    options: ToastNotificationOptions = {},
  ) =>
    pushNotification(content, {
      ...options,
      type: "error",
    }),
});
