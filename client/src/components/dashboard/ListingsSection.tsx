// client/src/components/dashboard/ListingsSection.tsx
import React from "react";
import {
  BarChart3,
  Plus,
  Zap,
  Crown,
  Calendar,
  MapPin,
  AlertTriangle,
  Eye,
  Heart,
  MessageCircle,
  Trash2,
  Car,
} from "lucide-react";
import { useQuotaCheck } from "@/hooks/useQuotaCheck";
import { QuotaModal } from "../QuotaModal";

interface ListingsSectionProps {
  userVehicles: any[];
  deletedVehicles: any[];
  //  listingFilter: string;
  //  setListingFilter: (filter: string) => void;
  listingFilter: "all" | "approved" | "draft" | "pending" | "rejected";
  setListingFilter: React.Dispatch<
    React.SetStateAction<"all" | "approved" | "draft" | "pending" | "rejected">
  >;
  dbUser: any;
  quotaInfo: any;
  brandIcon: string;
  boostStatuses: Record<string, any>;
  onCreateListing: () => void;
  openBoostModal: (id: string, title: string) => void;
  openDeletionModal: (id: string, title: string) => void;
  formatPrice: (price: number) => string;
  getFilterLabel: (filter: string) => string;
  getFilterDescription: (filter: string, count: number) => string;
  getEmptyStateTitle: (filter: string) => string;
  getEmptyStateDescription: (filter: string) => string;
  translateDeletionReason: (reason: string) => string;
}

export default function ListingsSection({
  userVehicles,
  deletedVehicles,
  listingFilter,
  setListingFilter,
  dbUser,
  quotaInfo,
  brandIcon,
  boostStatuses,
  onCreateListing,
  openBoostModal,
  openDeletionModal,
  formatPrice,
  getFilterLabel,
  getFilterDescription,
  getEmptyStateTitle,
  getEmptyStateDescription,
  translateDeletionReason,
}: ListingsSectionProps) {
  // Hook pour l'interception quota avec modal
  const { checkQuotaBeforeAction, isQuotaModalOpen, quotaInfo: quotaModalInfo, closeQuotaModal } = useQuotaCheck(dbUser?.id);

  // Filtrer les annonces selon le filtre sélectionné
  const activeVehicles = userVehicles.filter((vehicle) => {
    if ((vehicle as any).deletedAt) return false;

    switch (listingFilter) {
      case "approved":
        return vehicle.status === "approved";
      case "draft":
      case "pending":
        return vehicle.status === "draft" || vehicle.status === "pending";
      case "rejected":
        return vehicle.status === "rejected";
      case "all":
      default:
        return true;
    }
  });

  // Compter les annonces par statut pour les badges
  const statusCounts = {
    all: userVehicles.filter((v) => !(v as any).deletedAt).length,
    approved: userVehicles.filter(
      (v) => !(v as any).deletedAt && v.status === "approved",
    ).length,
    pending: userVehicles.filter(
      (v) =>
        !(v as any).deletedAt &&
        (v.status === "draft" || v.status === "pending"),
    ).length,
    rejected: userVehicles.filter(
      (v) => !(v as any).deletedAt && v.status === "rejected",
    ).length,
  };

  return (
    <div className="space-y-12">
      {/* Section Mes annonces actives */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes annonces</h1>
            <div className="mt-2 space-y-2">
              <p className="text-gray-600 text-lg">
                {activeVehicles.length} annonce
                {activeVehicles.length !== 1 ? "s" : ""}{" "}
                {listingFilter === "all"
                  ? "au total"
                  : getFilterLabel(listingFilter)}
              </p>

              {/* Indicateur de quota pour les comptes professionnels */}
              {dbUser?.type === "professional" && quotaInfo && (
                <div
                  className={`flex items-center space-x-2 text-sm p-3 rounded-lg ${
                    quotaInfo.canCreate
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <BarChart3
                    className={`h-4 w-4 ${
                      quotaInfo.canCreate ? "text-green-600" : "text-red-600"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      quotaInfo.canCreate ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    Quota: {quotaInfo.activeListings}
                    {quotaInfo.maxListings ? `/${quotaInfo.maxListings}` : ""}
                    {quotaInfo.maxListings
                      ? " annonces autorisées"
                      : " (illimité)"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Bouton nouvelle annonce avec interception quota */}
            <button
              onClick={() => checkQuotaBeforeAction(onCreateListing)}
              className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              data-testid="button-create-listing"
            >
              <Plus className="h-5 w-5" />
              <span>Nouvelle annonce</span>
            </button>
          </div>
        </div>

        {/* Filtres rapides */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Filtrer par statut
          </h3>
          <div className="flex flex-wrap gap-3">
            {/* Toutes */}
            <button
              onClick={() => setListingFilter("all")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                listingFilter === "all"
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>📋 Toutes</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {statusCounts.all}
              </span>
            </button>

            {/* Approuvées (Actives) */}
            <button
              onClick={() => setListingFilter("approved")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                listingFilter === "approved"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <span>✅ Actives</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {statusCounts.approved}
              </span>
            </button>

            {/* En attente */}
            <button
              onClick={() => setListingFilter("pending")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                listingFilter === "pending"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              <span>🕐 En attente</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {statusCounts.pending}
              </span>
            </button>

            {/* Rejetées */}
            <button
              onClick={() => setListingFilter("rejected")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                listingFilter === "rejected"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              <span>❌ Rejetées</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {statusCounts.rejected}
              </span>
            </button>
          </div>

          {/* Indicateur du filtre actif */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Filtre actif :</strong>{" "}
              {getFilterDescription(listingFilter, activeVehicles.length)}
            </p>
          </div>
        </div>

        {activeVehicles.length > 0 ? (
          <div className="grid gap-8">
            {activeVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="md:flex">
                  <div className="md:w-80 h-64 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                    {vehicle.images.length > 0 ? (
                      <img
                        src={vehicle.images[0]}
                        alt={vehicle.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={brandIcon}
                          alt="Brand icon"
                          className="w-20 h-20 opacity-60"
                        />
                      </div>
                    )}
                    {/* Badges Premium et Boost */}
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
                      {vehicle.isBoosted && (
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 shadow-lg">
                          <Zap className="h-4 w-4" />
                          <span>Boosté</span>
                        </div>
                      )}
                      {vehicle.isPremium && (
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 shadow-lg">
                          <Crown className="h-4 w-4" />
                          <span>Premium</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {vehicle.title}
                        </h3>
                        <p className="text-3xl font-bold text-primary-bolt-500 mb-4">
                          {formatPrice(vehicle.price)}
                        </p>
                        <div className="flex items-center space-x-6 text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5" />
                            <span className="font-medium">{vehicle.year}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5" />
                            <span className="font-medium">
                              {vehicle.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            vehicle.status === "approved"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : vehicle.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : vehicle.status === "draft"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {vehicle.status === "approved"
                            ? "✓ Approuvée"
                            : vehicle.status === "pending"
                              ? "⏳ En attente"
                              : vehicle.status === "draft"
                                ? "📝 En attente de validation"
                                : "❌ Rejetée"}
                        </span>
                        {vehicle.isBoosted && vehicle.boostedUntil && (
                          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            <Zap className="h-3 w-3 inline mr-1" />
                            Boost actif jusqu'au{" "}
                            {new Date(vehicle.boostedUntil).toLocaleDateString(
                              "fr-FR",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Affichage de la raison du rejet */}
                    {vehicle.status === "rejected" &&
                      vehicle.rejectionReason && (
                        <div className="mt-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold text-red-900 mb-1">
                                Raison du refus :
                              </h4>
                              <p className="text-sm text-red-800">
                                {vehicle.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="flex justify-between items-center">
                      {/* Afficher les compteurs seulement pour les annonces approuvées ou en attente */}
                      {vehicle.status === "approved" ||
                      vehicle.status === "pending" ? (
                        <div className="flex items-center space-x-8">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Eye className="h-5 w-5" />
                            <span className="font-semibold">
                              {vehicle.views}
                            </span>
                            <span className="text-sm">vues</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Heart className="h-5 w-5" />
                            <span className="font-semibold">
                              {vehicle.favorites}
                            </span>
                            <span className="text-sm">favoris</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MessageCircle className="h-5 w-5" />
                            <span className="font-semibold">3</span>
                            <span className="text-sm">messages</span>
                          </div>
                        </div>
                      ) : (
                        <div>{/* vide */}</div>
                      )}

                      <div className="flex items-center space-x-3">
                        {/* Afficher les boutons seulement pour les annonces approuvées ou en attente */}
                        {!(vehicle as any).deletedAt &&
                          (vehicle.status === "approved" ||
                            vehicle.status === "draft") && (
                            <>
                              {boostStatuses[vehicle.id]?.isActive ? (
                                <span className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg">
                                  <Zap className="h-4 w-4" />
                                  <span>🚀 Annonce boostée</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    openBoostModal(vehicle.id, vehicle.title)
                                  }
                                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                  data-testid={`button-boost-${vehicle.id}`}
                                >
                                  <Zap className="h-4 w-4" />
                                  <span>Booster</span>
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  openDeletionModal(vehicle.id, vehicle.title)
                                }
                                className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-bolt-100 to-primary-bolt-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <Car className="h-12 w-12 text-primary-bolt-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {getEmptyStateTitle(listingFilter)}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {getEmptyStateDescription(listingFilter)}
            </p>
          </div>
        )}
      </div>

      {/* Section Annonces supprimées */}
      {deletedVehicles.length > 0 && (
        <div className="space-y-8">
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <Trash2 className="h-7 w-7 text-gray-500" />
                  <span>Annonces supprimées</span>
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  {deletedVehicles.length} annonce
                  {deletedVehicles.length !== 1 ? "s" : ""} supprimée
                  {deletedVehicles.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deletedVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {vehicle.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {vehicle.brand} {vehicle.model} • {vehicle.year}
                    </p>
                  </div>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Supprimée
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prix :</span>
                    <span className="font-semibold text-gray-900">
                      {vehicle.price.toLocaleString()} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Supprimée le :
                    </span>
                    <span className="text-sm text-gray-900">
                      {(vehicle as any).deletedAt
                        ? new Date(
                            (vehicle as any).deletedAt,
                          ).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </span>
                  </div>
                  {(vehicle as any).deletionReason && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Raison de suppression :
                      </p>
                      <p className="text-sm text-gray-600">
                        {translateDeletionReason(
                          (vehicle as any).deletionReason,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quota Modal */}
      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={closeQuotaModal}
        quotaInfo={quotaModalInfo || { used: 0, maxListings: 5 }}
        onUpgrade={() => {
          closeQuotaModal();
          window.location.href = "/subscription-plans";
        }}
      />
    </div>
  );
}
