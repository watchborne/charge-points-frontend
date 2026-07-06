"use client";

import classNames from "classnames";
import { AlertCircle, CheckCircle, Loader, LogOut, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { WS_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import svgLogo from "@/public/favicon.svg";

import { useWebSocket } from "../../hooks/useWebSocket";

export const Header = () => {
  const t = useTranslations("");
  const { status } = useWebSocket(WS_URL);
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const webSocketConnectionStatus = useMemo(() => {
    const sizing = "h-6 w-6";

    switch (status) {
      case "CONNECTING":
        return <Loader className={classNames(sizing, "animate-spin")} />;
      case "CONNECTED":
        return <CheckCircle className={classNames(sizing, "text-green-600")} />;
      case "DISCONNECTED":
        return <XCircle className={classNames(sizing, "text-red-600")} />;
      case "ERROR":
        return <AlertCircle className={classNames(sizing, "text-yellow-600")} />;
      default:
        return null;
    }
  }, [status]);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={svgLogo}
              alt="Watchborne logo"
              width="56"
              className="h-10 w-10 sm:h-14 sm:w-14"
            />
            <h1 className="text-lg font-bold text-gray-900 sm:text-2xl">{t("appName")}</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/app/sites"
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === "/app/sites"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              {t("layout.navbar.app.links.sites")}
            </Link>
            <Link
              href="/app/charge-points"
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === "/app/charge-points"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              {t("layout.navbar.app.links.chargePoints")}
            </Link>
          </div>
          <div className="flex items-center gap-4 sm:ml-auto">
            <div className="flex items-center gap-2">
              <p className="hidden sm:block">{t("layout.navbar.app.connectionStatus")}:</p>
              {webSocketConnectionStatus}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("layout.navbar.actions.logout")}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
