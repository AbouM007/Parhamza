import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Flag, Eye, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "wouter";

interface ListingReport {
  id: string;
  listing_id: number;
  reporter_id: string | null;
  ip_address: string | null;
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
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  in_review: {
    label: "En cours d'examen",
    color: "bg-blue-100 text-blue-800",
    icon: Eye,
  },
  resolved: {
    label: "Résolu",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejeté",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
};

export default function ReportsSection() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ListingReport | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminComment, setAdminComment] = useState("");
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Headers admin pour l'authentification temporaire
  const adminHeaders = {
    'x-user-email': 'admin@passionauto2roues.com',
    'authorization': 'admin:admin@passionauto2roues.com'
  };

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/reports', {
          headers: adminHeaders
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des signalements');
        }
        
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Erreur chargement signalements:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les signalements.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReports();
  }, [toast]);

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
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_comment: comment }),
        headers: { 
          "Content-Type": "application/json",
          ...adminHeaders
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du signalement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Recharger les signalements
      const loadReports = async () => {
        const response = await fetch('/api/admin/reports', {
          headers: adminHeaders
        });
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      };
      loadReports();
      
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Gérez et modérez les signalements d'annonces
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-bolt-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des signalements...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <Flag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun signalement pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusInfo = statusLabels[report.status];
            const StatusIcon = statusInfo?.icon || Clock;
            const reporterInfo = report.reporter_id 
              ? (report.reporter_email || "Utilisateur") 
              : `Anonyme (${report.ip_address?.slice(0, 12)}...)`;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <Flag className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {report.listing_title || `Annonce #${report.listing_id}`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Signalé par {reporterInfo} •{" "}
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
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">
                        {categoryLabels[report.reason] || report.reason}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo?.label}
                      </span>
                    </div>

                    {report.description && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {report.admin_comment && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-600 mb-1">
                              Commentaire admin
                            </p>
                            <p className="text-sm text-gray-700">
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
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
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

      {/* Update Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Traiter le signalement
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Mettez à jour le statut et ajoutez un commentaire pour ce signalement.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire administrateur (optionnel)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminComment(e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires sur cette modération..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                  data-testid="textarea-admin-comment"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
