import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { format } from "date-fns";
import classNames from "classnames";
import { enGB } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "./button";
import { Calendar } from "./calendar";

export const Datepicker = ({
  value,
  onChange,
  placeholder = "Select a date",
  disabled,
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={classNames(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value ? format(value, "dd MMMM yyyy", { locale: enGB }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          locale={enGB}
        />
      </PopoverContent>
    </Popover>
  );
};
