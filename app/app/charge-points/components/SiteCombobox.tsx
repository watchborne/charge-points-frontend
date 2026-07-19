import { Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SiteComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  sites: Site[];
};

export const SiteCombobox = ({ value, onChange, sites }: SiteComboboxProps) => {
  const t = useTranslations("");
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
          {selected ? selected.name : t("appPage.sites.siteCombobox.unassigned")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={t("appPage.sites.siteCombobox.search")} />
          <CommandList>
            <CommandEmpty>{t("appPage.sites.siteCombobox.empty")}</CommandEmpty>
            <CommandGroup>
              {/* Explicit "no site" choice — leaves the charge point unassigned. */}
              <CommandItem
                value=""
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={classNames("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")}
                />
                {t("appPage.sites.siteCombobox.unassigned")}
              </CommandItem>
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
