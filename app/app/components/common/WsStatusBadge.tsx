import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import { WebSocketStatus } from "../../ws/ws-manager";

interface WsStatusBadgeProps {
  status: WebSocketStatus;
}

export const WsStatusBadge = ({ status }: WsStatusBadgeProps) => {
  const t = useTranslations("");

  if (status === "CONNECTED") {
    return (
      <Badge className="gap-1.5">
        <LiveDot />
        {t("appPage.dashboard.live")}
      </Badge>
    );
  }

  if (status === "CONNECTING") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Loader className="h-3 w-3 animate-spin" />
        {t("layout.navbar.app.wsStatus.connecting")}
      </Badge>
    );
  }

  if (status === "ERROR") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-status-error/30 text-status-error-foreground"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-status-error" />
        {t("layout.navbar.app.wsStatus.error")}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-status-offline" />
      {t("layout.navbar.app.wsStatus.disconnected")}
    </Badge>
  );
};

const LiveDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-error opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-status-error" />
  </span>
);
