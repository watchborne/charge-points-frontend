"use client";

import { useTranslations } from "next-intl";

import { LogoutButton } from "@/app/auth/components/LogoutButton";
import { Navbar, NavbarLink } from "@/app/components/layout/Navbar";
import { WS_URL } from "@/lib/constants";

import { useWebSocket } from "../../hooks/useWebSocket";
import { WsStatusBadge } from "../common/WsStatusBadge";

export const Header = () => {
  const t = useTranslations("");
  const { status } = useWebSocket(WS_URL);

  const links = [
    { key: "sites", label: t("layout.navbar.app.links.sites"), url: "/app/sites" },
    {
      key: "charge-points",
      label: t("layout.navbar.app.links.chargePoints"),
      url: "/app/charge-points",
    },
  ] satisfies NavbarLink[];

  return (
    <Navbar links={links}>
      <div className="flex items-center gap-4 sm:ml-auto">
        <WsStatusBadge status={status} />
        <LogoutButton />
      </div>
    </Navbar>
  );
};
