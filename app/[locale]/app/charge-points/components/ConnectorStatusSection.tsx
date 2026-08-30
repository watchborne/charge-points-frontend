import { AvailabilityType } from "@watchborne/charge-points-types";
import { Button, Callout } from "@watchborne/electrons";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { Loader2, Power, Unlock, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChangeAvailabilityOutcome, UnlockConnectorOutcome } from "@/lib/api-charge-points";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { ConnectorStatusIcon } from "../../components/common/ConnectorStatusIcon";
import { StatusActionDropdown } from "../../components/common/StatusActionDropdown";

type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; outcome: ChangeAvailabilityOutcome };

type UnlockConnectorState =
  { status: "idle" } | { status: "loading" } | { status: "done"; outcome: UnlockConnectorOutcome };

type ConnectorStatusSectionProps = {
  chargePoint: ChargePointWithConnectors;
  availabilityState: Record<string, AvailabilityState>;
  unlockConnectorState: Record<string, UnlockConnectorState>;
  onChangeAvailability: (key: string, connectorId: number, type: AvailabilityType) => Promise<void>;
  onUnlockConnector: (key: string, connectorId: number) => Promise<void>;
};

const formatSampledValue = (sample: { value: string; unit?: string }): string =>
  sample.unit ? `${sample.value} ${sample.unit}` : sample.value;

const availabilityErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.availability.result.notFound";
    case 409:
      return "appPage.chargePoints.availability.result.notConnectedOrRejected";
    case 502:
      return "appPage.chargePoints.availability.result.stationError";
    case 504:
      return "appPage.chargePoints.availability.result.timeout";
    default:
      return "appPage.chargePoints.availability.result.genericError";
  }
};

const availabilitySuccessMessageKey = (status: ChangeAvailabilityOutcome & { ok: true }): string =>
  status.status === "Scheduled"
    ? "appPage.chargePoints.availability.result.scheduled"
    : "appPage.chargePoints.availability.result.accepted";

const unlockConnectorErrorMessageKey = (httpStatus: number): string => {
  switch (httpStatus) {
    case 404:
      return "appPage.chargePoints.unlockConnector.result.notFound";
    case 409:
      return "appPage.chargePoints.unlockConnector.result.notConnectedOrFailed";
    case 502:
      return "appPage.chargePoints.unlockConnector.result.stationError";
    case 504:
      return "appPage.chargePoints.unlockConnector.result.timeout";
    default:
      return "appPage.chargePoints.unlockConnector.result.genericError";
  }
};

export const ConnectorStatusSection = ({
  chargePoint,
  availabilityState,
  unlockConnectorState,
  onChangeAvailability,
  onUnlockConnector,
}: ConnectorStatusSectionProps) => {
  const t = useTranslations("");

  if (chargePoint.connectors.length === 0) {
    return null;
  }

  return (
    <div className="divide-y rounded-md border">
      {chargePoint.connectors.map((connector) => {
        const state = availabilityState[connector.id] ?? { status: "idle" };
        const unlockState = unlockConnectorState[connector.id] ?? { status: "idle" };

        return (
          <div key={connector.id} className="flex flex-col gap-1.5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("appPage.chargePoints.detail.connector", {
                  connectorId: connector.connectorId,
                })}
              </span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <ConnectorStatusIcon status={connector.status} />
                  <span className="text-sm font-medium">{connector.status}</span>
                </div>
                <StatusActionDropdown
                  currentStatus=""
                  disabled={state.status === "loading"}
                  trigger={
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={state.status === "loading"}
                      aria-label={t("appPage.chargePoints.availability.button")}
                    >
                      {state.status === "loading" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
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
                  onStatusChange={(value) =>
                    onChangeAvailability(
                      connector.id,
                      connector.connectorId,
                      value as AvailabilityType,
                    )
                  }
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={unlockState.status === "loading"}
                  aria-label={t("appPage.chargePoints.unlockConnector.button")}
                  onClick={() => onUnlockConnector(connector.id, connector.connectorId)}
                >
                  {unlockState.status === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            {connector.lastMeterValue && (
              <div
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                title={t("appPage.chargePoints.detail.lastMeterValue")}
              >
                <Zap className="h-3 w-3 shrink-0" />
                <span>
                  {connector.lastMeterValue.sampledValue.map(formatSampledValue).join(" · ")}
                </span>
                <span>
                  (
                  {formatDistanceToNow(new Date(connector.lastMeterValue.timestamp), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                  )
                </span>
              </div>
            )}
            {state.status === "done" &&
              (state.outcome.ok ? (
                <p className="text-xs font-medium text-status-available-foreground">
                  {t(availabilitySuccessMessageKey(state.outcome))}
                </p>
              ) : (
                <Callout
                  description={t(availabilityErrorMessageKey(state.outcome.httpStatus))}
                  variant="error"
                />
              ))}
            {unlockState.status === "done" &&
              (unlockState.outcome.ok ? (
                <p className="text-xs font-medium text-status-available-foreground">
                  {t("appPage.chargePoints.unlockConnector.result.unlocked")}
                </p>
              ) : (
                <Callout
                  description={t(unlockConnectorErrorMessageKey(unlockState.outcome.httpStatus))}
                  variant="error"
                />
              ))}
          </div>
        );
      })}
    </div>
  );
};
