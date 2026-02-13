import { Battery, RefreshCw } from "lucide-react";

type HeaderProps = {
  onRefreshClicked: () => void;
};

export const Header = ({ onRefreshClicked }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Supervision Bornes de Recharge
            </h1>
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
    </header>
  );
};
