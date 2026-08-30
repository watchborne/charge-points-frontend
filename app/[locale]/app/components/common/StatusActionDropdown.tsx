"use client";

import { Button } from "@watchborne/electrons";
import { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StatusActionOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface StatusActionDropdownProps {
  currentStatus: string;
  options: StatusActionOption[];
  onStatusChange: (value: string) => void;
  disabled?: boolean;
  /** Overrides the default status-label trigger, e.g. to keep a call site's own icon button. */
  trigger?: ReactNode;
  align?: "start" | "end";
}

export const StatusActionDropdown = ({
  currentStatus,
  options,
  onStatusChange,
  disabled = false,
  trigger,
  align = "end",
}: StatusActionDropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {trigger ?? (
        <Button variant="outline" disabled={disabled}>
          {options.find((opt) => opt.value === currentStatus)?.label || currentStatus}
        </Button>
      )}
    </DropdownMenuTrigger>
    <DropdownMenuContent align={align}>
      {options.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => onStatusChange(option.value)}
          disabled={option.disabled || option.value === currentStatus}
        >
          {option.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
