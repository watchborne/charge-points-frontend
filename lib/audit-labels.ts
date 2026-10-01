import type { AuditActor } from "./api-audit";

type Translate = (key: string) => string;

/** A `USER` actor renders as their email; a `SYSTEM` actor as "System — <source>". */
export const auditActorLabel = (actor: AuditActor, t: Translate): string =>
  actor.kind === "USER"
    ? actor.email
    : `${t("appPage.activity.systemActor")} — ${t(`appPage.activity.systemSources.${actor.source}`)}`;
