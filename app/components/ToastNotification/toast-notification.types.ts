import type { ReactNode } from "react";

export type ToastNotificationType = "success" | "error" | "warning";

export interface ToastNotificationOptions {
  dismissible?: boolean;
  disappearInMs?: number;
}

export interface PushNotificationOptions extends ToastNotificationOptions {
  type: ToastNotificationType;
}

export type ToastNotificationContent = ReactNode;

export interface ToastNotificationApi {
  pushNotification: (
    content: ToastNotificationContent,
    options: PushNotificationOptions,
  ) => string | number;

  pushSuccessNotification: (
    content: ToastNotificationContent,
    options?: ToastNotificationOptions,
  ) => string | number;

  pushErrorNotification: (
    content: ToastNotificationContent,
    options?: ToastNotificationOptions,
  ) => string | number;

  pushWarningNotification: (
    content: ToastNotificationContent,
    options?: ToastNotificationOptions,
  ) => string | number;
}
