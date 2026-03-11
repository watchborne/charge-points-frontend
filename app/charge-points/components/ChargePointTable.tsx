import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type ChargePointTableProps = {
  items: ChargePoint[];
  onEditClicked: (cp: ChargePoint) => void;
  onDeleteClicked: (cp: ChargePoint) => void;
  onToggleActive: (cp: ChargePoint) => void;
};

export const ChargePointTable = ({
  items,
  onEditClicked,
  onDeleteClicked,
  onToggleActive,
}: ChargePointTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Serial number</TableHead>
          <TableHead>Firmware</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((cp) => (
          <TableRow key={cp.uuid} className={!cp.isActive ? "opacity-50" : ""}>
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
            <TableCell>
              <Switch
                checked={cp.isActive}
                onCheckedChange={() => onToggleActive(cp)}
                aria-label={`Toggle ${cp.name} active state`}
              />
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditClicked(cp)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteClicked(cp)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
