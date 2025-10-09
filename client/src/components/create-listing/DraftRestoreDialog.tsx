import { FileText, Trash2, Clock, X } from "lucide-react";

interface DraftRestoreDialogProps {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
  draftInfo: {
    photoCount: number;
    savedAt: Date;
  };
}

export function DraftRestoreDialog({
  open,
  onContinue,
  onDiscard,
  draftInfo,
}: DraftRestoreDialogProps) {
  if (!open) return null;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
    return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()} />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-bolt-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-7 w-7 text-primary-bolt-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Brouillon trouvé
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{formatDate(draftInfo.savedAt)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Nous avons retrouvé votre brouillon d'annonce non publiée.
          </p>
          {draftInfo.photoCount > 0 && (
            <div className="bg-primary-bolt-50 dark:bg-primary-bolt-900/20 border border-primary-bolt-200 dark:border-primary-bolt-800 rounded-lg p-4">
              <p className="text-primary-bolt-700 dark:text-primary-bolt-300 font-medium flex items-center gap-2">
                <span className="text-2xl">📸</span>
                {draftInfo.photoCount} photo{draftInfo.photoCount > 1 ? "s" : ""} sauvegardée{draftInfo.photoCount > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
            <span className="text-lg">💡</span>
            <span><strong>Conseil :</strong> Continuez votre brouillon pour ne pas perdre votre travail, ou recommencez à zéro si vous souhaitez créer une nouvelle annonce.</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 rounded-xl font-semibold transition-all"
            data-testid="button-discard-draft"
          >
            <Trash2 className="h-5 w-5" />
            Recommencer à zéro
          </button>
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            data-testid="button-continue-draft"
          >
            <FileText className="h-5 w-5" />
            Continuer le brouillon
          </button>
        </div>
      </div>
    </div>
  );
}
