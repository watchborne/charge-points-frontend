import { GenericStatusBadge } from "@/app/[locale]/app/components/common/GenericStatusBadge";
import { ReliabilityBucket } from "@/lib/fleet-reliability";
import { reliabilityBucketColor } from "@/lib/status";

const LABEL_KEY: Record<ReliabilityBucket, string> = {
  healthy: "appPage.dashboard.fleetReliability.bucket.healthy",
  degraded: "appPage.dashboard.fleetReliability.bucket.degraded",
  critical: "appPage.dashboard.fleetReliability.bucket.critical",
};

export const FleetReliabilityBadge = ({ bucket }: { bucket: ReliabilityBucket }) => (
  <GenericStatusBadge
    status={bucket}
    getTone={reliabilityBucketColor}
    getLabelKey={(b) => LABEL_KEY[b]}
  />
);
