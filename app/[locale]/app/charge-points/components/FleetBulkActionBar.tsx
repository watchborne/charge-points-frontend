"use client";

import { AvailabilityType, ChargePoint, ResetType } from "@watchborne/charge-points-types";
import { Button } from "@watchborne/electrons";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Power,
  RotateCcw,
  Unlock,
  X,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  getAvailabilityErrorMessageKey,
  getResetErrorMessageKey,
  getUnlockConnectorErrorMessageKey,
} from "@/lib/error-messages";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { ActionsDropdown } from "../../components/common/ActionsDropdown";
import { StatusActionDropdown } from "../../components/common/StatusActionDropdown";
import { useBulkChargePointActions } from "../hooks/useBulkChargePointActions";

type FleetBulkActionBarProps = {
  chargePoints: ChargePointWithConnectors[];
  onClear: () => void;
};

/** One station's outcome, reduced to what the result list needs to render —
 * shared by all three commands so `renderResults` below stays a single,
 * non-generic function instead of one specialized per outcome type. */
type BulkResultItem = {
  chargePointId: ChargePoint["id"];
  chargePointName: string;
  ok: boolean;
  errorMessageKey?: string;
};

type BulkActionUiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: BulkResultItem[] };

const IDLE: BulkActionUiState = { status: "idle" };

/**
 * Fans a chosen command (Reset / Change Availability / Unlock Connector) out
 * to every charge point currently selected in `ChargePointFleetPanel`'s list
 * — see `useBulkChargePointActions` for why each station's outcome is
 * reported separately rather than as one pass/fail. Rendered only while at
 * least one charge point is selected; the selection itself lives in the
 * parent panel, since it also drives the list's checkboxes.
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

  // Drop any previous batch's result banner once the selection itself
  // changes, so a stale outcome list is never shown attributed to a
  // different set of charge points.
  useEffect(() => {
    setResetState(IDLE);
    setAvailabilityState(IDLE);
    setUnlockState(IDLE);
  }, [selectionKey]);

  const isBusy =
    resetState.status === "loading" ||
    availabilityState.status === "loading" ||
    unlockState.status === "loading";

  const handleReset = async (type: ResetType) => {
    setResetState({ status: "loading" });
    const results = await bulkReset(chargePoints, type);
    setResetState({
      status: "done",
      results: results.map(
        (result): BulkResultItem => ({
          chargePointId: result.chargePointId,
          chargePointName: result.chargePointName,
          ok: result.outcome.ok,
          errorMessageKey: result.outcome.ok
            ? undefined
            : getResetErrorMessageKey(result.outcome.httpStatus),
        }),
      ),
    });
  };

  const handleChangeAvailability = async (type: AvailabilityType) => {
    setAvailabilityState({ status: "loading" });
    const results = await bulkChangeAvailability(chargePoints, type);
    setAvailabilityState({
      status: "done",
      results: results.map(
        (result): BulkResultItem => ({
          chargePointId: result.chargePointId,
          chargePointName: result.chargePointName,
          ok: result.outcome.ok,
          errorMessageKey: result.outcome.ok
            ? undefined
            : getAvailabilityErrorMessageKey(result.outcome.httpStatus),
        }),
      ),
    });
  };

  const handleUnlockConnector = async () => {
    setUnlockState({ status: "loading" });
    const results = await bulkUnlockConnector(chargePoints);
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
            disabled={isBusy}
            trigger={
              <Button variant="outline" size="sm" disabled={isBusy}>
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
            onAction={(actionId) => void handleReset(actionId as ResetType)}
          />

          <StatusActionDropdown
            align="end"
            currentStatus=""
            disabled={isBusy}
            trigger={
              <Button variant="outline" size="sm" disabled={isBusy}>
                {availabilityState.status === "loading" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
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
            onStatusChange={(value) => void handleChangeAvailability(value as AvailabilityType)}
          />

          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => void handleUnlockConnector()}
          >
            {unlockState.status === "loading" ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Unlock className="h-4 w-4 mr-1.5" />
            )}
            {t("appPage.chargePoints.unlockConnector.button")}
          </Button>
        </div>
      </div>

      {renderResults(resetState)}
      {renderResults(availabilityState)}
      {renderResults(unlockState)}
    </div>
  );
};
