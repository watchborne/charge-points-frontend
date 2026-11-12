"use client";

import { Button, Callout, Input } from "@watchborne/electrons";
import { Textarea } from "@watchborne/electrons";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { defaultLocale, isLocale } from "@/i18n/locale";
import { api } from "@/lib/api";
import { reportError } from "@/lib/report-error";

const EMPTY_FORM = { company: "", name: "", email: "", phone: "", chargePoints: "", message: "" };

type FormState = typeof EMPTY_FORM;
type Status = "idle" | "sending" | "sent" | "error";

export const ContactForm = () => {
  const t = useTranslations("");
  const currentLocale = useLocale();
  const locale = isLocale(currentLocale) ? currentLocale : defaultLocale;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");

  const bind = (field: keyof FormState) => ({
    name: field,
    value: form[field],
    disabled: status === "sending",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.Contact.send({ ...form, locale });
      setForm(EMPTY_FORM);
      setStatus("sent");
    } catch (error) {
      reportError(error, "ContactForm.submit");
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

      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={999999}
        step={1}
        placeholder={t("contactPage.form.chargePoints")}
        autoComplete="off"
        {...bind("chargePoints")}
      />

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

      <Button type="submit" className="w-full" loading={status === "sending"}>
        {t("contactPage.form.submit")}
      </Button>
    </form>
  );
};
