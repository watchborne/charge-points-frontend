import { useTranslations } from "next-intl";
import { ChargePointWithConnectors } from "@/types/charge-point";
import { FirmwarePanel } from "./FirmwarePanel";

type ChargePointMetadataSectionProps = {
  chargePoint: ChargePointWithConnectors;
};

export const ChargePointMetadataSection = ({
  chargePoint,
}: ChargePointMetadataSectionProps) => {
  const t = useTranslations("");

  if (!chargePoint.meta) {
    return null;
  }

  return (
    <div className="divide-y rounded-md border">
      {chargePoint.meta.vendor && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {t("appPage.chargePoints.form.fields.vendor")}
          </span>
          <span className="text-sm font-medium">{chargePoint.meta.vendor}</span>
        </div>
      )}
      {chargePoint.meta.model && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {t("appPage.chargePoints.form.fields.model")}
          </span>
          <span className="text-sm font-medium">{chargePoint.meta.model}</span>
        </div>
      )}
      {chargePoint.meta.serialNumber && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {t("appPage.chargePoints.form.fields.serialNumber")}
          </span>
          <span className="font-mono text-sm">{chargePoint.meta.serialNumber}</span>
        </div>
      )}
      <FirmwarePanel
        chargePointId={chargePoint.id}
        firmwareVersion={chargePoint.meta?.firmwareVersion}
        ocppVersion={chargePoint.ocppVersion}
      />
    </div>
  );
};
