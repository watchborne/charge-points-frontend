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
  return (
    <AlertDialog open={!!deleteTarget}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete « {deleteTarget?.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            Destroy action: this site will be unrecoverable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onDeleteClicked}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
