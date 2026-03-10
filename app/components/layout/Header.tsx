import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import {
  AlertCircle,
  Battery,
  CheckCircle,
  Loader,
  XCircle,
} from "lucide-react";

import { useWebSocket } from "@/app/hooks/useWebSocket";

export const Header = () => {
  const { status } = useWebSocket("ws://localhost:3000/ws");
  const pathname = usePathname();

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
        return (
          <AlertCircle className={classNames(sizing, "text-yellow-600")} />
        );
      default:
        return null;
    }
  }, [status]);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Charge points monitor
            </h1>
          </Link>
          <div className="ml-8 flex items-center gap-3">
            <Link
              href="/sites"
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === "/sites"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              Sites
            </Link>
            <Link
              href="/charge-points"
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === "/charge-points"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              Charge points
            </Link>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <p>Connection status:</p>
              {webSocketConnectionStatus}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
