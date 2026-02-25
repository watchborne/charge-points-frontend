import { useState } from "react";
import classNames from "classnames";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Site } from "@/types/site";

type SiteComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  sites: Site[];
};

export const SiteCombobox = ({ value, onChange, sites }: SiteComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selected = sites.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? selected.name : "Select a site..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search for site..." />
          <CommandList>
            <CommandEmpty>No site found.</CommandEmpty>
            <CommandGroup>
              {sites.map((site) => (
                <CommandItem
                  key={site.id}
                  value={site.name}
                  onSelect={() => {
                    onChange(site.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={classNames(
                      "mr-2 h-4 w-4",
                      value === site.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {site.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
