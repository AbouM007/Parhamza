import { ArrowLeft } from "lucide-react";

interface MobilePageHeaderProps {
  title: string;
  onBack?: () => void;
}

export function MobilePageHeader({ title, onBack }: MobilePageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center px-4 h-14">
        <button
          onClick={handleBack}
          className="flex items-center justify-center h-9 w-9 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="ml-3 font-semibold text-lg text-gray-900 truncate flex-1" data-testid="text-page-title">
          {title}
        </h1>
      </div>
    </div>
  );
}
