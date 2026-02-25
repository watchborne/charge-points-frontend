"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Zap, ChevronDown, Server } from "lucide-react";
import classNames from "classnames";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Site } from "@/types/site";

import { SiteCombobox } from "./SiteCombobox";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ChargePointFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<ChargePointFormValues>;
  onSubmit: (values: ChargePointFormValues) => void;
  mode: "create" | "edit";
  sites: Site[];
  defaultSiteId?: string;
};

const chargePointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  siteId: z.string().min(1, "Site is required"),
  chargePointVendor: z.string().optional(),
  chargePointModel: z.string().optional(),
  serialNumber: z.string().optional(),
  firmwareVersion: z.string().optional(),
});

export type ChargePointFormValues = z.infer<typeof chargePointSchema>;

export const ChargePointFormDialog = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode,
  sites,
  defaultSiteId,
}: ChargePointFormDialogProps) => {
  const [metaOpen, setMetaOpen] = useState(false);

  const form = useForm<ChargePointFormValues>({
    resolver: zodResolver(chargePointSchema),
    defaultValues: {
      name: "",
      siteId: defaultSiteId ?? "",
      chargePointVendor: "",
      chargePointModel: "",
      serialNumber: "",
      firmwareVersion: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name ?? "",
        siteId: initialValues?.siteId ?? defaultSiteId ?? "",
        chargePointVendor: initialValues?.chargePointVendor ?? "",
        chargePointModel: initialValues?.chargePointModel ?? "",
        serialNumber: initialValues?.serialNumber ?? "",
        firmwareVersion: initialValues?.firmwareVersion ?? "",
      });
      setMetaOpen(false);
    }
  }, [open]);

  const handleSubmit = (values: ChargePointFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {mode === "create" ? "Add a charge point" : "Edit the charge point"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in details about new charge point."
              : "Edit details about the charge point."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-2"
          >
            {/* Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: CP-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Site */}
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <FormControl>
                    <SiteCombobox
                      value={field.value}
                      onChange={field.onChange}
                      sites={sites}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section meta repliable */}
            <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground border border-dashed"
                >
                  <span className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Technical information
                  </span>
                  <ChevronDown
                    className={classNames(
                      "h-4 w-4 transition-transform duration-200",
                      metaOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="chargePointVendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Schneider Electric"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chargePointModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Terra AC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial number</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SN-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firmwareVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firmware</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 1.2.3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
