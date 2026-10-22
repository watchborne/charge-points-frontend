"use client";

import { Callout } from "@watchborne/electrons";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import type { AuditEntry } from "@/lib/api-audit";

import { AuditEntryRow } from "./AuditEntryRow";

type AuditTrailListProps = {
  entries: AuditEntry[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  emptyMessageKey: string;
  // Resolves a row's target (charge point/site/customer) to a display name —
  // only meaningful on the platform-wide page, which lists rows for more
  // than one target; the per-charge-point tab omits it.
  getTargetLabel?: (entry: AuditEntry) => string | undefined;
};

/**
 * Renders a cursor-paginated audit trail: a "load more" control that is both
 * clickable and auto-triggers via IntersectionObserver once it scrolls into
 * view — real infinite scroll, with a keyboard/click fallback for anyone
 * (or any test) that can't rely on the observer firing.
 */
export const AuditTrailList = ({
  entries,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyMessageKey,
  getTargetLabel,
}: AuditTrailListProps) => {
  const t = useTranslations("");
  const sentinelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((observedEntries) => {
      if (observedEntries[0]?.isIntersecting) onLoadMore();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("appPage.activity.loading")}</p>;
  }

  if (isError) {
    return <Callout variant="error" description={t("appPage.activity.error")} />;
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t(emptyMessageKey)}</p>;
  }

  return (
    <div className="divide-y rounded-md border">
      {entries.map((entry) => (
        <div key={entry.id} className="px-3">
          <AuditEntryRow entry={entry} targetLabel={getTargetLabel?.(entry)} />
        </div>
      ))}
      {hasNextPage && (
        <button
          ref={sentinelRef}
          type="button"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          className="flex w-full justify-center py-3 text-xs text-muted-foreground hover:underline disabled:no-underline"
        >
          {isFetchingNextPage ? t("appPage.activity.loadingMore") : t("appPage.activity.loadMore")}
        </button>
      )}
    </div>
  );
};
