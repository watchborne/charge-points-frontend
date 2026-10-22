import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { AuditEntryFilters, ListAuditEntriesFilters } from "@/lib/api-audit";
import { queryKeys } from "@/lib/queryKeys";

type UseAuditTrailParams =
  | { chargePointId: string; filters?: AuditEntryFilters }
  | { chargePointId?: undefined; filters?: ListAuditEntriesFilters };

/**
 * Cursor-paginated audit trail, scoped to one charge point when `chargePointId`
 * is given, or the caller's whole platform-wide trail otherwise — the first
 * `useInfiniteQuery` in this codebase (no fixed-window precedent fits a trail
 * that keeps growing indefinitely). `fetchNextPage` walks the cursor forward;
 * `entries` is every page fetched so far, flattened newest-first (the
 * backend's own order).
 */
export function useAuditTrail({ chargePointId, filters }: UseAuditTrailParams) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.audit.list({ chargePointId, ...filters }),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      chargePointId
        ? api.Audit.listForChargePoint(chargePointId, { ...filters, cursor: pageParam })
        : api.Audit.list({ ...(filters as ListAuditEntriesFilters), cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const entries = query.data?.pages.flatMap((page) => page.items) ?? [];

  return { ...query, entries };
}
