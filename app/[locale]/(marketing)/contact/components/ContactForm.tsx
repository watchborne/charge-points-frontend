"use client";

import { Button, Callout, Input } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const EMPTY_FORM = { company: "", name: "", email: "", phone: "", chargePoints: "", message: "" };

type FormState = typeof EMPTY_FORM;
type Status = "idle" | "sending" | "sent" | "error";

export const ContactForm = () => {
  const t = useTranslations("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");

  const bind = (field: keyof FormState) => ({
    value: form[field],
    disabled: status === "sending",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.Contact.send(form);
      setForm(EMPTY_FORM);
      setStatus("sent");
    } catch (error) {
      console.error("contact message failed:", error);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8">
      <Input
        placeholder={t("contactPage.form.company")}
        autoComplete="organization"
        {...bind("company")}
      />

      <Input
        placeholder={t("contactPage.form.name")}
        required
        autoComplete="name"
        {...bind("name")}
      />

      <Input
        type="email"
        placeholder={t("contactPage.form.email")}
        required
        autoComplete="email"
        {...bind("email")}
      />

      <Input
        type="tel"
        placeholder={t("contactPage.form.phone")}
        autoComplete="tel"
        {...bind("phone")}
      />

      <Input placeholder={t("contactPage.form.chargePoints")} {...bind("chargePoints")} />

      <Textarea
        placeholder={t("contactPage.form.message")}
        required
        rows={5}
        {...bind("message")}
      />

      {status === "sent" && (
        <Callout variant="success" description={t("contactPage.form.success")} />
      )}
      {status === "error" && <Callout variant="error" description={t("contactPage.form.error")} />}

      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("contactPage.form.submit")}
      </Button>
    </form>
  );
};
