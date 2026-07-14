import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChargePoint } from "@/types/charge-point";

export const ChargePointDeletionDialog = ({
  deleteTarget,
  onOpenChange,
  onDeleteClicked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteTarget: ChargePoint | null;
  onDeleteClicked: () => void;
}) => {
  const t = useTranslations("");

  return (
    <AlertDialog open={!!deleteTarget}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteTarget && t("appPage.chargePoints.deletion.title", { name: deleteTarget.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("appPage.chargePoints.deletion.description")}
          </AlertDialogDescription>
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
