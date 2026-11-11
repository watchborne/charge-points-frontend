import { createTranslator } from "next-intl";

import { isLocale, defaultLocale } from "@/i18n/locale";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

const MESSAGES = { fr, en };

// Only the sender's name is echoed back: the acknowledgement goes to an address
// anyone can type into a public form, so it must not relay their free text.
export const buildContactAcknowledgement = (name: string, locale: string) => {
  const resolved = isLocale(locale) ? locale : defaultLocale;
  const t = createTranslator({ locale: resolved, messages: MESSAGES[resolved] });

  return {
    subject: t("contactPage.acknowledgement.subject"),
    text: [
      t("contactPage.acknowledgement.greeting", { name }),
      "",
      t("contactPage.acknowledgement.body"),
      "",
      t("contactPage.acknowledgement.noReply"),
      "",
      t("contactPage.acknowledgement.signature"),
    ].join("\n"),
  };
};
