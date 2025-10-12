import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Flag, Eye, MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface ListingReport {
  id: string;
  listing_id: number;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: "pending" | "in_review" | "resolved" | "rejected";
  admin_comment: string | null;
  created_at: string;
  listing_title?: string;
  reporter_email?: string;
}

const categoryLabels: Record<string, string> = {
  fraud: "🚨 Arnaque / Fraude",
  wrong_photos: "📷 Mauvaises photos",
  sold: "✅ Déjà vendu",
  wrong_info: "❌ Informations erronées",
  inappropriate: "⚠️ Contenu inapproprié",
  duplicate: "📋 Annonce en double",
  other: "❓ Autre problème",
};

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: Clock,
  },
  in_review: {
    label: "En cours d'examen",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Eye,
  },
  resolved: {
    label: "Résolu",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejeté",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    icon: XCircle,
  },
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ListingReport | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminComment, setAdminComment] = useState("");

  const { data: reports = [], isLoading } = useQuery<ListingReport[]>({
    queryKey: ["/api/admin/reports"],
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      comment,
    }: {
      reportId: string;
      status: string;
      comment?: string;
    }) => {
      return apiRequest(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_comment: comment }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Signalement mis à jour",
        description: "Le statut du signalement a été mis à jour avec succès.",
      });
      setSelectedReport(null);
      setNewStatus("");
      setAdminComment("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le signalement.",
      });
    },
  });

  const handleUpdateReport = () => {
    if (!selectedReport || !newStatus) return;
    updateReportMutation.mutate({
      reportId: selectedReport.id,
      status: newStatus,
      comment: adminComment || undefined,
    });
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accès refusé</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Vous devez être administrateur pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Flag className="h-8 w-8 text-primary-bolt-500" />
            Gestion des signalements
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gérez et modérez les signalements d'annonces
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-bolt-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des signalements...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Flag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun signalement pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const statusInfo = statusLabels[report.status];
              const StatusIcon = statusInfo?.icon || Clock;

              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <Flag className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {report.listing_title || `Annonce #${report.listing_id}`}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Signalé par {report.reporter_email || "Utilisateur"} •{" "}
                            {new Date(report.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                          {categoryLabels[report.reason] || report.reason}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo?.label}
                        </span>
                      </div>

                      {report.description && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {report.description}
                          </p>
                        </div>
                      )}

                      {report.admin_comment && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                Commentaire admin
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {report.admin_comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[180px]">
                      <Link href={`/vehicle/${report.listing_id}`}>
                        <button
                          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                          data-testid={`button-view-listing-${report.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          Voir l'annonce
                        </button>
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setNewStatus(report.status);
                          setAdminComment(report.admin_comment || "");
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-bolt-500 rounded-md hover:bg-primary-bolt-600 transition-colors flex items-center justify-center gap-2"
                        data-testid={`button-update-report-${report.id}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Traiter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Update Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Traiter le signalement
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Mettez à jour le statut et ajoutez un commentaire pour ce signalement.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  data-testid="select-report-status"
                >
                  <option value="">Sélectionnez un statut</option>
                  <option value="pending">En attente</option>
                  <option value="in_review">En cours d'examen</option>
                  <option value="resolved">Résolu</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commentaire administrateur (optionnel)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminComment(e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires sur cette modération..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  data-testid="textarea-admin-comment"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                data-testid="button-cancel-update"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateReport}
                disabled={!newStatus || updateReportMutation.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-bolt-500 rounded-md hover:bg-primary-bolt-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                data-testid="button-confirm-update"
              >
                {updateReportMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
