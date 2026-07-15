"use client";

import classNames from "classnames";
import { AlertCircle, CheckCircle, Loader, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { LogoutButton } from "@/app/auth/components/LogoutButton";
import { Navbar, NavbarLink } from "@/app/components/layout/Navbar";
import { WS_URL } from "@/lib/constants";

import { useWebSocket } from "../../hooks/useWebSocket";

export const Header = () => {
  const t = useTranslations("");
  const { status } = useWebSocket(WS_URL);

  const webSocketConnectionStatus = useMemo(() => {
    const sizing = "h-5 w-5";

    switch (status) {
      case "CONNECTING":
        return (
          <Loader
            role="img"
            aria-label={t("layout.navbar.app.wsStatus.connecting")}
            className={classNames(sizing, "animate-spin text-muted-foreground")}
          />
        );
      case "CONNECTED":
        return (
          <CheckCircle
            role="img"
            aria-label={t("layout.navbar.app.wsStatus.connected")}
            className={classNames(sizing, "text-status-available-foreground")}
          />
        );
      case "DISCONNECTED":
        return (
          <XCircle
            role="img"
            aria-label={t("layout.navbar.app.wsStatus.disconnected")}
            className={classNames(sizing, "text-status-error-foreground")}
          />
        );
      case "ERROR":
        return (
          <AlertCircle
            role="img"
            aria-label={t("layout.navbar.app.wsStatus.error")}
            className={classNames(sizing, "text-status-warning-foreground")}
          />
        );
      default:
        return null;
    }
  }, [status, t]);

  const links = [
    { key: "sites", label: t("layout.navbar.app.links.sites"), url: "/app/sites" },
    {
      key: "charge-points",
      label: t("layout.navbar.app.links.chargePoints"),
      url: "/app/charge-points",
    },
    {
      key: "configuration",
      label: t("layout.navbar.app.links.configuration"),
      url: "/app/configuration",
    },
  ] satisfies NavbarLink[];

  return (
    <Navbar links={links}>
      <div className="flex items-center gap-4 sm:ml-auto">
        <div className="flex items-center gap-2">{webSocketConnectionStatus}</div>
        <LogoutButton />
      </div>
    </Navbar>
  );
};
