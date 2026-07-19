"use client";

import { Toaster, type ToasterProps } from "sonner";

/**
 * Point de rendu global des notifications.
 *
 * Ce composant encapsule volontairement Sonner afin que le reste
 * de l'application ne dépende pas directement de la librairie.
 */
export function ToastNotification(props: ToasterProps) {
  return <Toaster position="top-right" richColors {...props} />;
}
