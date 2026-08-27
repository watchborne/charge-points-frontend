import { StatusPill, type StatusPillProps } from "@watchborne/electrons";
import { useTranslations } from "next-intl";

/** Generic status badge component that maps domain status to UI tone and i18n labels. */
export const GenericStatusBadge = <T extends string | number>({
  status,
  getTone,
  getLabelKey,
}: {
  status: T;
  getTone: (status: T) => StatusPillProps["tone"];
  getLabelKey: (status: T) => string;
}) => {
  const t = useTranslations("");
  const tone = getTone(status);
  const labelKey = getLabelKey(status);

  return <StatusPill tone={tone}>{t(labelKey)}</StatusPill>;
};
