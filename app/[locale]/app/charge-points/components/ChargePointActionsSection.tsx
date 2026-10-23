import { AvailabilityType, ResetType } from "@watchborne/charge-points-types";
import { Button, Callout, ActionsDropdown, StatusActionDropdown } from "@watchborne/electrons";
import { CheckCircle2, ChevronDown, Power, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChangeAvailabilityOutcome, ResetChargePointOutcome } from "@/lib/api-charge-points";
import { getResetErrorMessageKey, getAvailabilityErrorMessageKey } from "@/lib/error-messages";
import type { ChargePoint } from "@/types/charge-point";

import { ChargePointConfigurationDialog } from "./ChargePointConfigurationDialog";
import { ChargePointReleaseControl } from "./ChargePointReleaseControl";
import { DisplayMessageControl } from "./DisplayMessageControl";
import { DisplayMessagesPanel } from "./DisplayMessagesPanel";
import { TriggerMessageControl } from "./TriggerMessageControl";

export type ResetState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: ResetChargePointOutcome };

export type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ChangeAvailabilityOutcome };

const availabilitySuccessMessageKey = (status: ChangeAvailabilityOutcome & { ok: true }): string =>
  status.status === "Scheduled"
    ? "appPage.chargePoints.availability.result.scheduled"
    : "appPage.chargePoints.availability.result.accepted";

type ChargePointActionsSectionProps = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
  /** A deactivated charge point accepts no command: every control is disabled. */
  isActive: boolean;
  ocppVersion: ChargePoint["ocppVersion"];
  resetState: ResetState;
  onReset: (type: ResetType) => Promise<void>;
  wholeChargePointAvailability: AvailabilityState;
  onChangeAvailability: (type: AvailabilityType) => Promise<void>;
  // Fired when the caller releases their own access, so the page can deselect
  // the charge point.
  onReleased: () => void;
};

/**
 * The "Actions" tab: whole-charge-point controls, grouped as "controls"
 * (reset, configuration, availability), "messaging" (trigger message),
 * "displayMessages" (2.0.1: set/clear plus the `NotifyDisplayMessages`
 * history) and "access" (releasing the caller's membership). Per-connector
 * controls stay in `ConnectorStatusSection`. Each group shows its outcome
 * banner directly under it.
 */
export const ChargePointActionsSection = ({
  chargePointId,
  chargePointName,
  isActive,
  ocppVersion,
  resetState,
  onReset,
  wholeChargePointAvailability,
  onChangeAvailability,
  onReleased,
}: ChargePointActionsSectionProps) => {
  const t = useTranslations("");

  return (
    <div className="flex flex-col gap-4">
      {!isActive && (
        <Callout
          description={t("appPage.chargePoints.actionsTab.inactiveNotice")}
          variant="warning"
        />
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          {t("appPage.chargePoints.actionsTab.groups.controls")}
        </h4>

        <div className="flex flex-wrap items-stretch gap-2">
          <ActionsDropdown
            align="start"
            disabled={resetState.status === "loading" || !isActive}
            trigger={
              <Button
                variant="outline"
                size="sm"
                loading={resetState.status === "loading"}
                disabled={!isActive}
              >
                {resetState.status !== "loading" && <RotateCcw className="h-4 w-4 mr-1.5" />}
                {t("appPage.chargePoints.reset.button")}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            }
            actions={[
              { id: "Hard", label: t("appPage.chargePoints.reset.types.hard") },
              { id: "Soft", label: t("appPage.chargePoints.reset.types.soft") },
            ]}
            onAction={(actionId) => onReset(actionId as ResetType)}
          />

          <ChargePointConfigurationDialog
            chargePointId={chargePointId}
            chargePointName={chargePointName}
            disabled={!isActive}
          />

          <StatusActionDropdown
            align="start"
            currentStatus=""
            disabled={wholeChargePointAvailability.status === "loading" || !isActive}
            trigger={
              <Button
                variant="outline"
                size="sm"
                loading={wholeChargePointAvailability.status === "loading"}
                disabled={!isActive}
              >
                {wholeChargePointAvailability.status !== "loading" && (
                  <Power className="h-4 w-4 mr-1.5" />
                )}
                {t("appPage.chargePoints.availability.wholeChargePoint")}
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            }
            options={[
              {
                value: "Operative",
                label: t("appPage.chargePoints.availability.types.operative"),
              },
              {
                value: "Inoperative",
                label: t("appPage.chargePoints.availability.types.inoperative"),
              },
            ]}
            onStatusChange={(value) => onChangeAvailability(value as AvailabilityType)}
          />
        </div>

        {resetState.status === "done" &&
          (resetState.outcome.ok ? (
            <div className="flex items-center gap-2 rounded-lg border border-status-available/20 bg-status-available-soft p-3 text-status-available-foreground text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-medium">{t("appPage.chargePoints.reset.result.accepted")}</p>
            </div>
          ) : (
            <Callout
              description={t(getResetErrorMessageKey(resetState.outcome.httpStatus))}
              variant="error"
            />
          ))}

        {wholeChargePointAvailability.status === "done" &&
          (wholeChargePointAvailability.outcome.ok ? (
            <div className="flex items-center gap-2 rounded-lg border border-status-available/20 bg-status-available-soft p-3 text-status-available-foreground text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-medium">
                {t(availabilitySuccessMessageKey(wholeChargePointAvailability.outcome))}
              </p>
            </div>
          ) : (
            <Callout
              description={t(
                getAvailabilityErrorMessageKey(wholeChargePointAvailability.outcome.httpStatus),
              )}
              variant="error"
            />
          ))}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          {t("appPage.chargePoints.actionsTab.groups.messaging")}
        </h4>
        <TriggerMessageControl chargePointId={chargePointId} disabled={!isActive} />
      </section>

      {ocppVersion === "2.0.1" && (
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h4 className="text-sm font-semibold text-muted-foreground">
            {t("appPage.chargePoints.actionsTab.groups.displayMessages")}
          </h4>

          <DisplayMessageControl chargePointId={chargePointId} disabled={!isActive} />
          <DisplayMessagesPanel chargePointId={chargePointId} disabled={!isActive} />
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          {t("appPage.chargePoints.actionsTab.groups.access")}
        </h4>

        <ChargePointReleaseControl
          chargePointId={chargePointId}
          chargePointName={chargePointName}
          onReleased={onReleased}
        />
      </section>
    </div>
  );
};
