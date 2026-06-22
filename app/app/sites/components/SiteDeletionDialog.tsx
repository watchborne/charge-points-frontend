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
import { Site } from "@watchborne/charge-points-types";

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
