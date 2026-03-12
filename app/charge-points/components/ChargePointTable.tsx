import { ChargePoint } from "@/types/charge-point";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/app/components/charge-points/StatusBadge";

type ChargePointTableProps = {
  items: ChargePoint[];
  highlightedUuid?: string;
  onRowClicked: (cp: ChargePoint) => void;
  onToggleActive: (cp: ChargePoint) => void;
};

export const ChargePointTable = ({
  items,
  highlightedUuid,
  onRowClicked,
  onToggleActive,
}: ChargePointTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Serial number</TableHead>
          <TableHead>Firmware</TableHead>
          <TableHead>Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((cp) => (
          <TableRow
            key={cp.uuid}
            className={[
              "cursor-pointer",
              cp.uuid === highlightedUuid
                ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
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
              {cp.meta?.chargePointVendor || (
                <span className="text-slate-300">—</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {cp.meta?.chargePointModel || (
                <span className="text-slate-300">—</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm font-mono text-xs">
              {cp.meta?.serialNumber || (
                <span className="text-slate-300">—</span>
              )}
            </TableCell>
            <TableCell>
              {cp.meta?.firmwareVersion ? (
                <Badge variant="outline" className="font-mono text-xs">
                  v{cp.meta?.firmwareVersion}
                </Badge>
              ) : (
                <span className="text-slate-300">—</span>
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
