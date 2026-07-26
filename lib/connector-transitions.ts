// TEMPORARY: duplicates @watchborne/charge-points-types's connector-transitions.ts
// until that package's next version (adding CONNECTOR_STATUS_TRANSITIONS /
// isExpectedConnectorTransition) is released and package.json is bumped —
// replace this file's body with a re-export from "@watchborne/charge-points-types" then.
import { ConnectorStatus } from "@/types/charge-point";

/**
 * Expected adjacency between connector statuses, keyed by the status a
 * connector is currently in. This is a heuristic for anomaly detection in the
 * dashboard — e.g. flagging a `Faulted -> Charging` jump that skipped
 * `Available` — not a normative OCPP conformance state machine. A status
 * update is never rejected or hidden for failing this check; it is only used
 * to decide whether to surface a warning toast.
 *
 * `Occupied` (OCPP 2.0.1-only) is treated as the union of the 1.6 granular
 * in-use states it collapses (`Charging`, `SuspendedEV`, `SuspendedEVSE`,
 * `Finishing`), so it shares their expected neighbors.
 *
 * A few edges exist specifically to avoid false-positive noise from flows the
 * supervisor legitimately drives, not just from a station's own reporting:
 * `Unavailable` is reachable from every in-use/preparing state (a deferred
 * `ChangeAvailability` lands once the current transaction ends, from whatever
 * state the connector was in); `Preparing` can abort directly into any
 * `Suspended*`/`Finishing` state (the EV disconnects before charging starts);
 * `Reserved` can be consumed directly into `Charging`/`Occupied` (some 1.6
 * stations skip a separate `Preparing` report); `Faulted` can be
 * intentionally taken further out of service via `Unavailable`.
 */
export const CONNECTOR_STATUS_TRANSITIONS: Record<ConnectorStatus, ConnectorStatus[]> = {
  Available: ["Preparing", "Reserved", "Unavailable", "Faulted", "Charging", "Occupied"],
  Preparing: [
    "Charging",
    "Occupied",
    "Available",
    "Faulted",
    "Unavailable",
    "SuspendedEV",
    "SuspendedEVSE",
    "Finishing",
  ],
  Charging: [
    "SuspendedEV",
    "SuspendedEVSE",
    "Finishing",
    "Occupied",
    "Faulted",
    "Available",
    "Unavailable",
  ],
  SuspendedEV: [
    "Charging",
    "SuspendedEVSE",
    "Finishing",
    "Occupied",
    "Faulted",
    "Available",
    "Unavailable",
  ],
  SuspendedEVSE: [
    "Charging",
    "SuspendedEV",
    "Finishing",
    "Occupied",
    "Faulted",
    "Available",
    "Unavailable",
  ],
  Occupied: [
    "Charging",
    "SuspendedEV",
    "SuspendedEVSE",
    "Finishing",
    "Available",
    "Preparing",
    "Faulted",
    "Unavailable",
  ],
  Finishing: ["Available", "Faulted", "Unavailable"],
  Reserved: ["Available", "Preparing", "Unavailable", "Faulted", "Charging", "Occupied"],
  Unavailable: ["Available", "Faulted"],
  Faulted: ["Available", "Unavailable"],
};

/**
 * Whether reporting `to` right after `from` is an expected connector status
 * transition. Always true when `from === to` (a station re-sending its
 * current status is normal, not a transition).
 */
export const isExpectedConnectorTransition = (
  from: ConnectorStatus,
  to: ConnectorStatus,
): boolean => {
  if (from === to) return true;
  return CONNECTOR_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};
