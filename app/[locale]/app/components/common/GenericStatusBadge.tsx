import { ColorPill, type ColorPillProps } from "@watchborne/electrons";
import { useTranslations } from "next-intl";

/** Maps a status to a UI colour and an i18n label. */
export const GenericStatusBadge = <T extends string | number>({
  status,
  getTone,
  getLabelKey,
}: {
  status: T;
  getTone: (status: T) => ColorPillProps["color"];
  getLabelKey: (status: T) => string;
}) => {
  const t = useTranslations("");
  const color = getTone(status);
  const labelKey = getLabelKey(status);

  return <ColorPill color={color}>{t(labelKey)}</ColorPill>;
};
