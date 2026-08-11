import { Site } from "@watchborne/charge-points-types";
import { useTranslations } from "next-intl";

import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const SiteDeletionDialog = ({
  deleteTarget,
  onOpenChange,
  onDeleteClicked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteTarget: Site | null;
  onDeleteClicked: () => void;
}) => {
  const t = useTranslations("");

  return (
    <AlertDialog open={!!deleteTarget}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteTarget && t("appPage.sites.deletion.title", { name: deleteTarget.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t("appPage.sites.deletion.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onDeleteClicked}
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
