import { Mail, Building2, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const t = useTranslations("");

  return (
    <main className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="break-words text-3xl font-bold sm:text-4xl md:text-5xl">
          {t("contactPage.hero.title")}
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">{t("contactPage.hero.subtitle")}</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-6 p-8">
            <Input placeholder={t("contactPage.form.company")} />

            <Input placeholder={t("contactPage.form.name")} />

            <Input type="email" placeholder={t("contactPage.form.email")} />

            <Input placeholder={t("contactPage.form.phone")} />

            <Input placeholder={t("contactPage.form.chargePoints")} />

            <Input placeholder={t("contactPage.form.message")} />

            <Button className="w-full">{t("contactPage.form.submit")}</Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex gap-4 p-6">
              <Mail className="h-5 w-5" />

              <div>
                <h3 className="font-semibold">{t("contactPage.contact.email.title")}</h3>

                <p className="text-sm text-muted-foreground">
                  {t("contactPage.contact.email.value")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex gap-4 p-6">
              <Building2 className="h-5 w-5" />

              <div>
                <h3 className="font-semibold">{t("contactPage.contact.demo.title")}</h3>

                <p className="text-sm text-muted-foreground">
                  {t("contactPage.contact.demo.description")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex gap-4 p-6">
              <Phone className="h-5 w-5" />

              <div>
                <h3 className="font-semibold">{t("contactPage.contact.support.title")}</h3>

                <p className="text-sm text-muted-foreground">
                  {t("contactPage.contact.support.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
