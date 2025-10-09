import React from "react";
import {
  Building2,
  Star,
  Award,
  Calendar,
  User,
  Crown,
  Car,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Plus,
} from "lucide-react";
import { ProfessionalVerificationBanner } from "../ProfessionalVerificationBanner";

interface OverviewSectionProps {
  profile: any;
  user: any;
  professionalAccount: any;
  subscriptionInfo: any;
  userVehicles: any[];
  totalViews: number;
  totalFavorites: number;
  premiumListings: number;
  onCreateListing: () => void;
  formatPrice: (price: number) => string;
}

export default function OverviewSection({
  profile,
  user,
  professionalAccount,
  subscriptionInfo,
  userVehicles,
  totalViews,
  totalFavorites,
  premiumListings,
  onCreateListing,
  formatPrice,
}: OverviewSectionProps) {
  return (

  <div className="space-y-8">
    {/* Welcome Section */}
    <div className="relative bg-gradient-to-r from-primary-bolt-500 via-primary-bolt-600 to-primary-bolt-700 rounded-2xl p-8 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Bonjour, {profile?.name || user?.email?.split("@")[0]} ! 👋
            </h1>
            {/* Affichage du nom de société pour les comptes professionnels */}
            {profile?.type === "professional" &&
              professionalAccount?.company_name && (
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="h-5 w-5 text-cyan-200" />
                  <p className="text-cyan-100 text-xl font-semibold">
                    {professionalAccount.company_name}
                  </p>
                  {professionalAccount.is_verified && (
                    <div className="bg-green-500/30 text-green-100 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Vérifié</span>
                    </div>
                  )}
                </div>
              )}
            <p className="text-cyan-100 text-lg font-medium">
              {profile?.type === "professional"
                ? "Gérez votre activité professionnelle depuis votre tableau de bord"
                : "Bienvenue sur votre espace personnel"}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Award className="h-12 w-12 text-white/80" />
            </div>
          </div>
        </div>

        {/* Section d'informations enrichie */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Membre depuis */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-4 w-4 text-cyan-200" />
              <span className="text-sm font-medium text-cyan-100">
                Membre depuis
              </span>
            </div>
            <p className="text-lg font-bold text-white">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })
                : "Récemment"}
            </p>
          </div>

          {/* Type de compte */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="flex items-center space-x-2 mb-1">
              <User className="h-4 w-4 text-cyan-200" />
              <span className="text-sm font-medium text-cyan-100">
                Type de compte
              </span>
            </div>
            <p className="text-lg font-bold text-white">
              {profile?.type === "professional"
                ? "Professionnel"
                : "Particulier"}
            </p>
          </div>

          {/* Statut de vérification (pour les pros) */}
          {profile?.type === "professional" && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2 mb-1">
                <Building2 className="h-4 w-4 text-cyan-200" />
                <span className="text-sm font-medium text-cyan-100">
                  Statut
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {professionalAccount?.is_verified ? (
                  <span className="text-green-200">✓ Vérifié</span>
                ) : professionalAccount?.verification_status === "pending" ? (
                  <span className="text-yellow-200">⏳ En cours</span>
                ) : (
                  <span className="text-orange-200">⚠ Non vérifié</span>
                )}
              </p>
            </div>
          )}

          {/* Abonnement (pour les pros) */}
          {profile?.type === "professional" && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2 mb-1">
                <Crown className="h-4 w-4 text-cyan-200" />
                <span className="text-sm font-medium text-cyan-100">
                  Abonnement
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {subscriptionInfo?.isActive ? (
                  <span className="text-yellow-200">
                    {subscriptionInfo.planName === "starter" ||
                    subscriptionInfo.planName === 1
                      ? "Starter"
                      : subscriptionInfo.planName === "pro" ||
                          subscriptionInfo.planName === 2
                        ? "Pro"
                        : subscriptionInfo.planName === "premium" ||
                            subscriptionInfo.planName === 3
                          ? "Premium"
                          : "Pro Actif"}
                  </span>
                ) : (
                  <span className="text-gray-300">Gratuit</span>
                )}
              </p>
            </div>
          )}

          {/* Compte vérifié (pour les particuliers) */}
          {profile?.type !== "professional" && (profile as any)?.verified && (
            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-green-400/30">
              <div className="flex items-center space-x-2 mb-1">
                <Star className="h-4 w-4 text-green-200" />
                <span className="text-sm font-medium text-green-100">
                  Statut
                </span>
              </div>
              <p className="text-lg font-bold text-green-100">
                ✓ Compte vérifié
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Professional Verification Banner */}
    <ProfessionalVerificationBanner />

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 p-3 rounded-xl shadow-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {userVehicles.length}
            </p>
            <p className="text-sm text-gray-600 font-medium">Mes annonces</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-green-600 font-semibold text-sm bg-green-50 px-2 py-1 rounded-full">
            {userVehicles.filter((v) => v.status === "approved").length}{" "}
            actives
          </span>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 font-medium">Vues totales</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm bg-gray-50 px-2 py-1 rounded-full">
            Moy:{" "}
            {userVehicles.length > 0
              ? Math.round(totalViews / userVehicles.length)
              : 0}
            /annonce
          </span>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-3 rounded-xl shadow-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {totalFavorites}
            </p>
            <p className="text-sm text-gray-600 font-medium">Favoris</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-pink-600 text-sm bg-pink-50 px-2 py-1 rounded-full font-medium">
            Intérêt généré
          </span>
          <Heart className="h-4 w-4 text-pink-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-600">
              {premiumListings}
            </p>
            <p className="text-sm text-gray-600 font-medium">Premium</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-orange-600 font-semibold text-sm bg-orange-50 px-2 py-1 rounded-full">
            Mises en avant
          </span>
          <Crown className="h-4 w-4 text-orange-500" />
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button
        onClick={onCreateListing}
        className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <Plus className="h-8 w-8 mb-3" />
        <h3 className="text-lg font-semibold mb-2">Nouvelle annonce</h3>
        <p className="text-primary-bolt-100 text-sm">
          Publiez votre véhicule en quelques clics
        </p>
      </button>

      <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <MessageCircle className="h-8 w-8 mb-3" />
        <h3 className="text-lg font-semibold mb-2">Messages</h3>
        <p className="text-green-100 text-sm">1 nouvelle conversation</p>
      </button>

      <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <Crown className="h-8 w-8 mb-3" />
        <h3 className="text-lg font-semibold mb-2">Booster mes annonces</h3>
        <p className="text-orange-100 text-sm">Augmentez votre visibilité</p>
      </button>
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Activité récente
          </h2>
          <button className="text-primary-bolt-500 hover:text-primary-bolt-600 font-medium text-sm">
            Voir tout
          </button>
        </div>
      </div>
      <div className="p-6">
        {userVehicles.length > 0 ? (
          <div className="space-y-4">
            {userVehicles.slice(0, 5).map((vehicle) => {
              // Récupérer la première photo ou utiliser un placeholder
              const thumbnail = vehicle.photos && vehicle.photos.length > 0 
                ? vehicle.photos[0] 
                : null;
              
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl hover:from-primary-bolt-50 hover:to-primary-bolt-100/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg bg-gray-200 flex-shrink-0">
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={vehicle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                          <Car className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {vehicle.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Créée le{" "}
                        {new Date(vehicle.createdAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs bg-primary-bolt-100 text-primary-bolt-500 px-2 py-1 rounded-full font-medium">
                          {vehicle.views} vues
                        </span>
                        <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full font-medium">
                          {vehicle.favorites} ❤️
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-bolt-500">
                      {formatPrice(vehicle.price)}
                    </p>
                    {vehicle.isPremium && (
                      <span className="inline-flex items-center space-x-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                        <Crown className="h-3 w-3" />
                        <span>Premium</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="h-10 w-10 text-gray-400" />
            </div>

          </div>
        )}
      </div>
    </div>
  </div>
);
}