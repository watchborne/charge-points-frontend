"use client";

import { Toaster, type ToasterProps } from "sonner";

const DEFAULT_DURATION_MS = 15_000;

export function ToastNotification(props: ToasterProps) {
  return (
    <Toaster
      position="bottom-center"
      richColors
      closeButton
      duration={DEFAULT_DURATION_MS}
      {...props}
    />
  );
}
