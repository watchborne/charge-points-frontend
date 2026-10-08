import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { Button } from "@watchborne/electrons";
import classNames from "classnames";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { useDateFnsLocale } from "@/lib/date-locale";

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
  const dateLocale = useDateFnsLocale();
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
          {value ? format(value, "dd MMMM yyyy", { locale: dateLocale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          locale={dateLocale}
        />
      </PopoverContent>
    </Popover>
  );
};
