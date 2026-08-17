"use client";

import { Button, Callout } from "@watchborne/electrons";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { OCPP_SERVER_URL } from "@/lib/constants";

/**
 * Lets an installer generate their personal commissioning token: appended as
 * `?token=...` to a charge point's OCPP connection URL, it lets the server
 * auto-grant the installer membership on any unclaimed charge point that
 * connects with it (see charge-points-server's ADR 0002 and the claim step
 * wired into the OCPP connection handler). The plaintext token is only ever
 * shown once, right after it's (re)generated.
 */
export const CommissioningTokenPanel = () => {
  const t = useTranslations("");
  const format = useFormatter();

  const [hasToken, setHasToken] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await api.CommissioningToken.getStatus();
        if (cancelled) return;
        setHasToken(status.hasToken);
        setCreatedAt(status.createdAt);
      } catch {
        if (!cancelled) setError(t("common.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const issueToken = async () => {
    setError(null);
    setIssuing(true);
    try {
      const issued = await api.CommissioningToken.issueToken();
      setRevealedToken(issued.token);
      setHasToken(true);
      setCreatedAt(issued.createdAt);
      setCopied(false);
    } catch {
      setError(t("common.error"));
    } finally {
      setIssuing(false);
      setConfirmRegenerateOpen(false);
    }
  };

  const handleGenerateClicked = () => {
    if (hasToken) {
      setConfirmRegenerateOpen(true);
    } else {
      void issueToken();
    }
  };

  const copyToken = async () => {
    if (!revealedToken) return;
    await navigator.clipboard.writeText(revealedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // A placeholder, not a real station id: showing something concrete-looking
  // (e.g. "CP-001") invites pasting it verbatim, which — with discovery mode
  // on — adopts a charge point literally named that, and with a valid token
  // claims it for the caller (issue #281).
  const stationIdPlaceholder = t("appPage.configuration.commissioningToken.exampleUrlPlaceholder");
  const exampleUrl = `${OCPP_SERVER_URL}/${stationIdPlaceholder}?token=${revealedToken ?? "..."}`;

  return (
    <section className="rounded-lg border">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium">
          {t("appPage.configuration.commissioningToken.title")}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">
          {t("appPage.configuration.commissioningToken.description")}
        </p>

        {error && <Callout variant="error" description={error} />}

        {!loading && revealedToken && (
          <div className="flex flex-col gap-2">
            <Callout
              variant="warning"
              description={t("appPage.configuration.commissioningToken.revealedWarning")}
            />
            <div className="flex items-center gap-2">
              <code className="block w-full min-w-0 flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {revealedToken}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyToken()}
                aria-label={t("appPage.configuration.commissioningToken.copyCta")}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {t("appPage.configuration.commissioningToken.exampleLabel")}
              </p>
              <code className="block w-full rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {exampleUrl}
              </code>
            </div>
          </div>
        )}

        {!loading && !revealedToken && hasToken && createdAt && (
          <p className="text-sm text-muted-foreground">
            {t("appPage.configuration.commissioningToken.createdAtLabel", {
              date: format.dateTime(new Date(createdAt), {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
            })}
          </p>
        )}

        <Button
          type="button"
          variant={hasToken && !revealedToken ? "outline" : "default"}
          className="w-full sm:w-fit"
          disabled={loading || issuing}
          onClick={handleGenerateClicked}
        >
          {hasToken ? <RefreshCw className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          {hasToken
            ? t("appPage.configuration.commissioningToken.regenerateCta")
            : t("appPage.configuration.commissioningToken.generateCta")}
        </Button>
      </div>

      <AlertDialog open={confirmRegenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("appPage.configuration.commissioningToken.regenerateConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("appPage.configuration.commissioningToken.regenerateConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmRegenerateOpen(false)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction disabled={issuing} onClick={() => void issueToken()}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
