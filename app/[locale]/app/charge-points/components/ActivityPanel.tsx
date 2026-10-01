import { useTranslations } from "next-intl";

import { AuditTrailList } from "@/app/[locale]/app/components/common/AuditTrailList";
import { useAuditTrail } from "@/app/[locale]/app/hooks/useAuditTrail";

type ActivityPanelProps = {
  chargePointId: string;
};

export const ActivityPanel = ({ chargePointId }: ActivityPanelProps) => {
  const t = useTranslations("");
  const { entries, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAuditTrail({ chargePointId });

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold">{t("appPage.chargePoints.activity.title")}</h4>
      <AuditTrailList
        entries={entries}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        emptyMessageKey="appPage.chargePoints.activity.empty"
      />
    </div>
  );
};
