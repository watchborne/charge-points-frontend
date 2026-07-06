import { zodResolver } from "@hookform/resolvers/zod";
import { Globe } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Datepicker } from "@/components/ui/datepicker";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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

const siteFormSchema = z.object({
  name: z.string(),
  customer: z.string(),
  installDate: z.date(),
  lastVisit: z.date(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;

type SiteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<SiteFormValues>;
  onSubmit: (values: SiteFormValues) => void;
  mode: "create" | "edit";
};

export const SiteFormDialog = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode,
}: SiteFormDialogProps) => {
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      customer: initialValues?.customer ?? "",
      installDate: initialValues?.installDate,
      lastVisit: initialValues?.lastVisit,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name ?? "",
        customer: initialValues?.customer ?? "",
        installDate: initialValues?.installDate,
        lastVisit: initialValues?.lastVisit,
      });
    }
  }, [open, initialValues, form]);

  const handleSubmit = (values: SiteFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {mode === "create" ? "Add a site" : "Edit a site"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details about the new site."
              : "Edit the details about the new site."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Paris - Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="installDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Install date</FormLabel>
                    <FormControl>
                      <Datepicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Install date..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastVisit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last visit</FormLabel>
                    <FormControl>
                      <Datepicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Last visit..."
                        disabled={(date) => date > new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "create" ? "Create site" : "Save"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
