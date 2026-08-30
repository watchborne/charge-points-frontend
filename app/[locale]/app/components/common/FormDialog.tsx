import { Button } from "@watchborne/electrons";
import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  form: ReactNode;
  submitLabel: string;
  cancelLabel: string;
  onSubmit: () => void | Promise<void>;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  /** Overrides DialogContent's own width classes, e.g. `sm:max-w-[520px]`. */
  className?: string;
}

export const FormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  form,
  submitLabel,
  cancelLabel,
  onSubmit,
  isLoading = false,
  isSubmitDisabled = false,
  className,
}: FormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {form}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled || isLoading}
            aria-busy={isLoading}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
