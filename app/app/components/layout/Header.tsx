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
        return <Loader className={classNames(sizing, "animate-spin text-muted-foreground")} />;
      case "CONNECTED":
        return <CheckCircle className={classNames(sizing, "text-status-available-foreground")} />;
      case "DISCONNECTED":
        return <XCircle className={classNames(sizing, "text-status-error-foreground")} />;
      case "ERROR":
        return <AlertCircle className={classNames(sizing, "text-status-warning-foreground")} />;
      default:
        return null;
    }
  }, [status]);

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
        <div className="flex items-center gap-2">{webSocketConnectionStatus}</div>
        <LogoutButton />
      </div>
    </Navbar>
  );
};
