import type { AuditOutcome } from "@/lib/api-audit";
import { auditOutcomeColor } from "@/lib/status";

import { GenericStatusBadge } from "../common/GenericStatusBadge";

const OUTCOME_LABEL_KEY: Record<AuditOutcome, string> = {
  PENDING: "appPage.activity.outcomes.pending",
  SUCCEEDED: "appPage.activity.outcomes.succeeded",
  REJECTED: "appPage.activity.outcomes.rejected",
  FAILED: "appPage.activity.outcomes.failed",
  TIMED_OUT: "appPage.activity.outcomes.timedOut",
};

export const AuditOutcomeBadge = ({ outcome }: { outcome: AuditOutcome }) => (
  <GenericStatusBadge
    status={outcome}
    getTone={auditOutcomeColor}
    getLabelKey={(o) => OUTCOME_LABEL_KEY[o]}
  />
);
