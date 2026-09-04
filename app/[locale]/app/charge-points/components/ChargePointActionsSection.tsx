import { AvailabilityType, ResetType } from "@watchborne/charge-points-types";
import { Button, Callout } from "@watchborne/electrons";
import { CheckCircle2, ChevronDown, Loader2, Power, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChangeAvailabilityOutcome, ResetChargePointOutcome } from "@/lib/api-charge-points";
import { getResetErrorMessageKey, getAvailabilityErrorMessageKey } from "@/lib/error-messages";
import type { ChargePoint } from "@/types/charge-point";

import { ChargePointConfigurationDialog } from "./ChargePointConfigurationDialog";
import { TriggerMessageControl } from "./TriggerMessageControl";
import { ActionsDropdown } from "../../components/common/ActionsDropdown";
import { StatusActionDropdown } from "../../components/common/StatusActionDropdown";

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
  resetState: ResetState;
  onReset: (type: ResetType) => Promise<void>;
  wholeChargePointAvailability: AvailabilityState;
  onChangeAvailability: (type: AvailabilityType) => Promise<void>;
};

/**
 * The whole-charge-point action controls — reset, configuration, availability
 * and trigger-message — split out of `ChargePointDetailPanel`'s "main" tab
 * into their own dedicated tab so that overview page reads as status, and
 * this one as controls. Per-connector controls (availability/unlock) stay in
 * `ConnectorStatusSection` on the main tab: they're about a specific
 * connector, not the station as a whole.
 */
export const ChargePointActionsSection = ({
  chargePointId,
  chargePointName,
  resetState,
  onReset,
  wholeChargePointAvailability,
  onChangeAvailability,
}: ChargePointActionsSectionProps) => {
  const t = useTranslations("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-4">
        <ActionsDropdown
          align="start"
          disabled={resetState.status === "loading"}
          trigger={
            <Button variant="outline" size="sm" disabled={resetState.status === "loading"}>
              {resetState.status === "loading" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1.5" />
              )}
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
        />

        <StatusActionDropdown
          align="start"
          currentStatus=""
          disabled={wholeChargePointAvailability.status === "loading"}
          trigger={
            <Button
              variant="outline"
              size="sm"
              disabled={wholeChargePointAvailability.status === "loading"}
            >
              {wholeChargePointAvailability.status === "loading" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-1.5" />
              )}
              {t("appPage.chargePoints.availability.wholeChargePoint")}
              <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          }
          options={[
            { value: "Operative", label: t("appPage.chargePoints.availability.types.operative") },
            {
              value: "Inoperative",
              label: t("appPage.chargePoints.availability.types.inoperative"),
            },
          ]}
          onStatusChange={(value) => onChangeAvailability(value as AvailabilityType)}
        />
      </div>

      <TriggerMessageControl chargePointId={chargePointId} />

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
    </div>
  );
};
