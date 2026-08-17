"use client";

import { Button, Callout } from "@watchborne/electrons";
import { Ban, Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
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
 *
 * Revoking (as opposed to regenerating) stops working for a *new* one to
 * claim, but never affects a charge point already claimed with it — a safe
 * end-of-job action, not a destructive one.
 */
export const CommissioningTokenPanel = () => {
  const t = useTranslations("");

  const [hasToken, setHasToken] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);

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

  const revokeToken = async () => {
    setError(null);
    setRevoking(true);
    try {
      await api.CommissioningToken.revoke();
      setHasToken(false);
      setCreatedAt(null);
      setRevealedToken(null);
    } catch {
      setError(t("common.error"));
    } finally {
      setRevoking(false);
      setConfirmRevokeOpen(false);
    }
  };

  const copyToken = async () => {
    if (!revealedToken) return;
    await navigator.clipboard.writeText(revealedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exampleUrl = `${OCPP_SERVER_URL}/CP-001?token=${revealedToken ?? "..."}`;

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
              date: new Date(createdAt).toLocaleDateString("fr-FR"),
            })}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={hasToken && !revealedToken ? "outline" : "default"}
            className="w-full sm:w-fit"
            disabled={loading || issuing || revoking}
            onClick={handleGenerateClicked}
          >
            {hasToken ? <RefreshCw className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            {hasToken
              ? t("appPage.configuration.commissioningToken.regenerateCta")
              : t("appPage.configuration.commissioningToken.generateCta")}
          </Button>

          {hasToken && (
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-fit"
              disabled={loading || issuing || revoking}
              onClick={() => setConfirmRevokeOpen(true)}
            >
              <Ban className="h-4 w-4" />
              {t("appPage.configuration.commissioningToken.revokeCta")}
            </Button>
          )}
        </div>
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

      <AlertDialog open={confirmRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("appPage.configuration.commissioningToken.revokeConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("appPage.configuration.commissioningToken.revokeConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmRevokeOpen(false)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction disabled={revoking} onClick={() => void revokeToken()}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
