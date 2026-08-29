"use client";

import { Button } from "@watchborne/electrons";
import { useTranslations } from "next-intl";

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
}

export const StatusActionDropdown = ({
  currentStatus,
  options,
  onStatusChange,
  disabled = false,
}: StatusActionDropdownProps) => {
  const t = useTranslations("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {options.find((opt) => opt.value === currentStatus)?.label || currentStatus}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
};
