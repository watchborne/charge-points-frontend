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
    warning: () => toast.warning(content, sonnerOptions),
  };

  return notificationByType[type]();
}

// Defined at module scope (not inline in the hook's returned object) so each
// stays referentially stable across renders — components relying on them
// inside a `useEffect` dependency array (e.g. `useChargePoints`) must not
// re-run just because the component re-rendered.
function pushSuccessNotification(
  content: ToastNotificationContent,
  options: ToastNotificationOptions = {},
): string | number {
  return pushNotification(content, { ...options, type: "success" });
}

function pushErrorNotification(
  content: ToastNotificationContent,
  options: ToastNotificationOptions = {},
): string | number {
  return pushNotification(content, { ...options, type: "error" });
}

function pushWarningNotification(
  content: ToastNotificationContent,
  options: ToastNotificationOptions = {},
): string | number {
  return pushNotification(content, { ...options, type: "warning" });
}

export const useToastNotification = (): ToastNotificationApi => ({
  pushNotification,
  pushSuccessNotification,
  pushErrorNotification,
  pushWarningNotification,
});
