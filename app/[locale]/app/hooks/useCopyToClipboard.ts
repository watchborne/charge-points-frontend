import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useToastNotification } from "@/app/components/ToastNotification";

const COPIED_RESET_MS = 2000;

/**
 * Copy-to-clipboard with the failure modes handled: `navigator.clipboard.writeText`
 * rejects when the page is unfocused, in an insecure context or when permission
 * is denied, and that must be said out loud (a toast) rather than left as an
 * unhandled rejection — the commissioning token is shown only once. `copied`
 * flips back after a couple of seconds; the timer is cleared on re-copy, `reset`
 * and unmount, so it never fires `setCopied` on a gone component.
 */
export const useCopyToClipboard = () => {
  const t = useTranslations("");
  const { pushErrorNotification } = useToastNotification();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setCopied(false);
  }, [clearTimer]);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      clearTimer();
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        setCopied(false);
        pushErrorNotification(t("common.copyFailed"));
        return false;
      }
      setCopied(true);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCopied(false);
      }, COPIED_RESET_MS);
      return true;
    },
    [clearTimer, pushErrorNotification, t],
  );

  return { copied, copy, reset };
};
