"use client";

import {
  Button,
  Callout,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type StatusTone,
} from "@watchborne/electrons";
import { Ban, Check, Copy, KeyRound, RefreshCw } from "lucide-react";
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
import { CommissioningAttempt, CommissioningOutcome } from "@/lib/api-me";
import { OCPP_SERVER_URL } from "@/lib/constants";
import { toneDotClass } from "@/lib/status";

// available: the attempt is what an installer wants to see (a fresh claim, or
// an already-owned station recommissioned with a new token). error: refused
// because the station already belongs to someone else — the one outcome
// worth flagging as wrong, not just routine. warning: a stale/unknown token
// was presented — never actually returned by GET /api/me (it can't be
// attributed to any caller, see charge-points-server issue #420), kept here
// only so the mapping stays total over the shared outcome union.
const OUTCOME_TONE: Record<CommissioningOutcome, StatusTone> = {
  CLAIMED: "available",
  ALREADY_CLAIMED_BY_SELF: "available",
  ALREADY_CLAIMED_BY_OTHER: "error",
  UNKNOWN_TOKEN: "warning",
};

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
  const format = useFormatter();

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
  const [attempts, setAttempts] = useState<CommissioningAttempt[]>([]);
  const [chargePointNames, setChargePointNames] = useState<Map<string, string>>(new Map());

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

      // Recent commissioning activity (issue #420 / #278): best-effort — a
      // failure here must never block the token panel itself, so it's kept
      // out of the try/catch above and just leaves the list empty.
      try {
        const me = await api.Me.getMe();
        if (cancelled) return;
        setAttempts(me.commissioningAttempts);
        setChargePointNames(new Map(me.chargePoints.map((cp) => [cp.id, cp.name])));
      } catch {
        // Silent: the activity list is a nice-to-have, not core functionality.
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

  // A placeholder, not a real station id: showing something concrete-looking
  // (e.g. "CP-001") invites pasting it verbatim, which — with discovery mode
  // on — adopts a charge point literally named that, and with a valid token
  // claims it for the caller.
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

        {attempts.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t("appPage.configuration.commissioningToken.recentActivity.title")}
            </p>
            <div className="max-h-[220px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">
                      {t("appPage.configuration.commissioningToken.recentActivity.table.date")}
                    </TableHead>
                    <TableHead className="text-xs">
                      {t("appPage.configuration.commissioningToken.recentActivity.table.station")}
                    </TableHead>
                    <TableHead className="text-xs">
                      {t("appPage.configuration.commissioningToken.recentActivity.table.outcome")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...attempts]
                    .sort(
                      (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
                    )
                    .slice(0, 5)
                    .map((attempt) => {
                      const outcomeKey =
                        `appPage.configuration.commissioningToken.recentActivity.outcomes.` +
                        attempt.outcome;
                      const station =
                        chargePointNames.get(attempt.chargePointId) ?? attempt.chargePointId;

                      return (
                        <TableRow key={attempt.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format.dateTime(new Date(attempt.attemptedAt), {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-xs">{station}</TableCell>
                          <TableCell className="text-xs">
                            <span className="inline-flex items-start gap-1.5">
                              <span
                                aria-hidden
                                className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${toneDotClass[OUTCOME_TONE[attempt.outcome]]}`}
                              />
                              {t(outcomeKey)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
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
