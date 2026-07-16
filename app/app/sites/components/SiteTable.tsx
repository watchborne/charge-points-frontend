import { Site } from "@watchborne/charge-points-types";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";

type SiteTableProps = {
  sites: Site[];
  onEditClicked: (site: Site) => void;
  onDeleteClicked: (site: Site) => void;
};

export const SiteTable = ({ sites, onEditClicked, onDeleteClicked }: SiteTableProps) => {
  const t = useTranslations("");

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("appPage.sites.page.table.columns.name")}</TableHead>
            <TableHead>{t("appPage.sites.page.table.columns.customer")}</TableHead>
            <TableHead>{t("appPage.sites.page.table.columns.installDate")}</TableHead>
            <TableHead>{t("appPage.sites.page.table.columns.lastVisit")}</TableHead>
            <TableHead className="w-[60px]">
              {t("appPage.sites.page.table.columns.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                {t("appPage.sites.page.table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell className="font-medium">{site.customer}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(site.installedAt).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {site.lastVisitedAt
                    ? new Date(site.lastVisitedAt).toLocaleDateString("fr-FR")
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">
                          {t("appPage.sites.page.table.columns.actions")}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditClicked(site)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeleteClicked(site)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
