"use client";

import { AvailabilityType, ChargePoint, ResetType } from "@watchborne/charge-points-types";
import { Button, ActionsDropdown, StatusActionDropdown } from "@watchborne/electrons";
import { CheckCircle2, ChevronDown, Power, RotateCcw, Unlock, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  getAvailabilityErrorMessageKey,
  getResetErrorMessageKey,
  getUnlockConnectorErrorMessageKey,
} from "@/lib/error-messages";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { useBulkChargePointActions } from "../hooks/useBulkChargePointActions";

type FleetBulkActionBarProps = {
  chargePoints: ChargePointWithConnectors[];
  onClear: () => void;
};

/** One station's outcome, shared by the three commands. */
type BulkResultItem = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
  ok: boolean;
  errorMessageKey?: string;
};

type BulkActionUiState =
  { status: "idle" } | { status: "loading" } | { status: "done"; results: BulkResultItem[] };

const IDLE: BulkActionUiState = { status: "idle" };

/**
 * Sends Reset, Change Availability or Unlock Connector to every selected
 * charge point, reporting each outcome separately. Rendered only while
 * something is selected; the selection lives in the parent panel.
 */
export const FleetBulkActionBar = ({ chargePoints, onClear }: FleetBulkActionBarProps) => {
  const t = useTranslations("");
  const { bulkReset, bulkChangeAvailability, bulkUnlockConnector } = useBulkChargePointActions();

  const [resetState, setResetState] = useState<BulkActionUiState>(IDLE);
  const [availabilityState, setAvailabilityState] = useState<BulkActionUiState>(IDLE);
  const [unlockState, setUnlockState] = useState<BulkActionUiState>(IDLE);

  const selectionKey = chargePoints
    .map((chargePoint) => chargePoint.id)
    .sort()
    .join(",");

  // Clear the previous batch's results when the selection changes.
  useEffect(() => {
    setResetState(IDLE);
    setAvailabilityState(IDLE);
    setUnlockState(IDLE);
  }, [selectionKey]);

  // Inactive charge points accept no command (409): left out, not failed.
  const actionableChargePoints = chargePoints.filter((chargePoint) => chargePoint.isActive);
  const skippedCount = chargePoints.length - actionableChargePoints.length;

  const isBusy =
    resetState.status === "loading" ||
    availabilityState.status === "loading" ||
    unlockState.status === "loading";
  const isActionDisabled = isBusy || actionableChargePoints.length === 0;

  const handleReset = async (type: ResetType) => {
    setResetState({ status: "loading" });
    const results = await bulkReset(actionableChargePoints, type);
    setResetState({
      status: "done",
      results: results.map((result): BulkResultItem => ({
        chargePointId: result.chargePointId,
        chargePointName: result.chargePointName,
        ok: result.outcome.ok,
        errorMessageKey: result.outcome.ok
          ? undefined
          : getResetErrorMessageKey(result.outcome.httpStatus),
      })),
    });
  };

  const handleChangeAvailability = async (type: AvailabilityType) => {
    setAvailabilityState({ status: "loading" });
    const results = await bulkChangeAvailability(actionableChargePoints, type);
    setAvailabilityState({
      status: "done",
      results: results.map((result): BulkResultItem => ({
        chargePointId: result.chargePointId,
        chargePointName: result.chargePointName,
        ok: result.outcome.ok,
        errorMessageKey: result.outcome.ok
          ? undefined
          : getAvailabilityErrorMessageKey(result.outcome.httpStatus),
      })),
    });
  };

  const handleUnlockConnector = async () => {
    setUnlockState({ status: "loading" });
    const results = await bulkUnlockConnector(actionableChargePoints);
    setUnlockState({
      status: "done",
      results: results.map((result): BulkResultItem => {
        if (result.outcome.ok) {
          return {
            chargePointId: result.chargePointId,
            chargePointName: result.chargePointName,
            ok: true,
          };
        }
        return {
          chargePointId: result.chargePointId,
          chargePointName: result.chargePointName,
          ok: false,
          errorMessageKey:
            "reason" in result.outcome
              ? "appPage.chargePoints.bulkActions.unlockConnector.noConnector"
              : getUnlockConnectorErrorMessageKey(result.outcome.httpStatus),
        };
      }),
    });
  };

  const renderResults = (state: BulkActionUiState) => {
    if (state.status !== "done") return null;

    const succeeded = state.results.filter((result) => result.ok).length;

    return (
      <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-3 text-sm">
        <p className="font-medium text-muted-foreground">
          {t("appPage.chargePoints.bulkActions.results.summary", {
            succeeded,
            failed: state.results.length - succeeded,
          })}
        </p>
        <ul className="flex flex-col gap-1">
          {state.results.map((result) => (
            <li key={result.chargePointId} className="flex items-center gap-2">
              {result.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-available-foreground" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              )}
              <span className="truncate">{result.chargePointName}</span>
              {result.errorMessageKey && (
                <span className="truncate text-xs text-muted-foreground">
                  {t(result.errorMessageKey)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium">
          {t("appPage.chargePoints.bulkActions.selectedCount", { count: chargePoints.length })}
        </p>

        <Button variant="ghost" size="sm" onClick={onClear} disabled={isBusy}>
          <X className="h-3.5 w-3.5 mr-1.5" />
          {t("appPage.chargePoints.bulkActions.clearSelection")}
        </Button>

        <div className="ml-auto flex flex-wrap items-stretch gap-2">
          <ActionsDropdown
            align="end"
            disabled={isActionDisabled}
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isActionDisabled}
                loading={resetState.status === "loading"}
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
            onAction={(actionId) => void handleReset(actionId as ResetType)}
          />

          <StatusActionDropdown
            align="end"
            currentStatus=""
            disabled={isActionDisabled}
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isActionDisabled}
                loading={availabilityState.status === "loading"}
              >
                {availabilityState.status !== "loading" && <Power className="h-4 w-4 mr-1.5" />}
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
            onStatusChange={(value) => void handleChangeAvailability(value as AvailabilityType)}
          />

          <Button
            variant="outline"
            size="sm"
            disabled={isActionDisabled}
            loading={unlockState.status === "loading"}
            onClick={() => void handleUnlockConnector()}
          >
            {unlockState.status !== "loading" && <Unlock className="h-4 w-4 mr-1.5" />}
            {t("appPage.chargePoints.unlockConnector.button")}
          </Button>
        </div>
      </div>

      {skippedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("appPage.chargePoints.bulkActions.inactiveSkipped", { count: skippedCount })}
        </p>
      )}

      {renderResults(resetState)}
      {renderResults(availabilityState)}
      {renderResults(unlockState)}
    </div>
  );
};
