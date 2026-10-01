"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@watchborne/electrons";
import classNames from "classnames";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AuditOutcomeBadge } from "@/app/[locale]/app/components/charge-points/AuditOutcomeBadge";
import type { AuditEntry } from "@/lib/api-audit";
import { auditActorLabel } from "@/lib/audit-labels";

type AuditEntryRowProps = {
  entry: AuditEntry;
  // Rendered next to the actor — a resolved charge point/site name on the
  // platform-wide /app/activity page, where one row can target any of them.
  // Omitted on the per-charge-point tab, where the target is always the
  // charge point already open.
  targetLabel?: string;
};

export const AuditEntryRow = ({ entry, targetLabel }: AuditEntryRowProps) => {
  const t = useTranslations("");
  const [open, setOpen] = useState(false);
  const hasPayload = Object.keys(entry.payload).length > 0;

  return (
    <div className="flex flex-col gap-1 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {t(`appPage.activity.actions.${entry.action}`)}
          </span>
          <span className="text-xs text-muted-foreground">
            {auditActorLabel(entry.actor, t)}
            {targetLabel ? ` · ${targetLabel}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AuditOutcomeBadge outcome={entry.outcome} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(entry.occurredAt), "dd/MM/yyyy HH:mm:ss", { locale: enGB })}
          </span>
        </div>
      </div>

      {entry.outcomeDetail && (
        <span className="text-xs text-muted-foreground">{entry.outcomeDetail}</span>
      )}

      {hasPayload && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
            <ChevronDown
              className={classNames("h-3 w-3 transition-transform", open && "rotate-180")}
            />
            {t("appPage.activity.details")}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
