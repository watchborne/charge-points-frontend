import { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  form: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void | Promise<void>;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
}

export const FormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  form,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
  isLoading = false,
  isSubmitDisabled = false,
}: FormDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-start gap-4">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="flex-grow space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="mt-4">{form}</div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t pt-4">
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onSubmit}
            disabled={isSubmitDisabled || isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Loading..." : submitLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
