import { useMemo } from "react";
import classNames from "classnames";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import {
  AlertCircle,
  Battery,
  CheckCircle,
  Loader,
  RefreshCw,
  XCircle,
} from "lucide-react";

type HeaderProps = {
  onRefreshClicked: () => void;
};

export const Header = ({ onRefreshClicked }: HeaderProps) => {
  const { status } = useWebSocket("ws://localhost:3000/ws");

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Charge points monitor
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p>Connection status:</p>
              {webSocketConnectionStatus}
            </div>
            <button
              onClick={onRefreshClicked}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
