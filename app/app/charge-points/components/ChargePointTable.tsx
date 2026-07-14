import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatusBadge } from "../../components/charge-points/StatusBadge";

type ChargePointTableProps = {
  items: ChargePointWithConnectors[];
  highlightedId?: string;
  onRowClicked: (cp: ChargePointWithConnectors) => void;
  onToggleActive: (cp: ChargePointWithConnectors) => void;
};

export const ChargePointTable = ({
  items,
  highlightedId,
  onRowClicked,
  onToggleActive,
}: ChargePointTableProps) => {
  const t = useTranslations("");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("appPage.chargePoints.page.table.columns.status")}</TableHead>
          <TableHead>{t("appPage.chargePoints.page.table.columns.name")}</TableHead>
          <TableHead>{t("appPage.chargePoints.page.table.columns.vendor")}</TableHead>
          <TableHead>{t("appPage.chargePoints.page.table.columns.model")}</TableHead>
          <TableHead>{t("appPage.chargePoints.page.table.columns.serialNumber")}</TableHead>
          <TableHead>{t("appPage.chargePoints.page.table.columns.firmware")}</TableHead>
          <TableHead>{t("appPage.chargePoints.page.table.columns.active")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((cp) => (
          <TableRow
            key={cp.id}
            className={[
              "cursor-pointer",
              cp.id === highlightedId
                ? "bg-charge-soft ring-1 ring-inset ring-charge/30"
                : !cp.isActive
                  ? "opacity-50"
                  : "",
            ].join(" ")}
            onClick={() => onRowClicked(cp)}
          >
            <TableCell className="text-muted-foreground text-sm">
              <StatusBadge status={cp.connection.status} />
            </TableCell>
            <TableCell className="font-medium">{cp.name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {cp.meta?.vendor || <span className="text-muted-foreground/50">—</span>}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {cp.meta?.model || <span className="text-muted-foreground/50">—</span>}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm font-mono text-xs">
              {cp.meta?.serialNumber || <span className="text-muted-foreground/50">—</span>}
            </TableCell>
            <TableCell>
              {cp.meta?.firmwareVersion ? (
                <Badge variant="outline" className="font-mono text-xs">
                  v{cp.meta?.firmwareVersion}
                </Badge>
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={cp.isActive}
                onCheckedChange={() => onToggleActive(cp)}
                aria-label={`Toggle ${cp.name} active state`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
