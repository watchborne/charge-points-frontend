"use client";

import { Toaster, type ToasterProps } from "sonner";

export function ToastNotification(props: ToasterProps) {
  return <Toaster position="top-right" richColors {...props} />;
}
