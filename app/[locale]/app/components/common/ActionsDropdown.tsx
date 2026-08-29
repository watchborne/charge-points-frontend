"use client";

import { Button } from "@watchborne/electrons";
import { MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
}

export interface ActionsDropdownProps {
  actions: ActionItem[];
  onAction: (actionId: string) => void;
  disabled?: boolean;
  size?: "sm" | "lg";
}

export const ActionsDropdown = ({
  actions,
  onAction,
  disabled = false,
  size = "sm",
}: ActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} disabled={disabled} className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <div key={action.id}>
            {action.divider && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => onAction(action.id)}
              disabled={action.disabled}
              className={action.destructive ? "text-red-600" : ""}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
