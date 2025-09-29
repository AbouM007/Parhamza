import React, { useState, useEffect } from "react";
import {
  ProfileSection,
  MessagesSection,
  ListingsSection,
  OverviewSection,
  PurchaseHistorySection,
  FavoritesSection,
  PremiumSection,
} from "../dashboard";

import {
  Car,
  MessageCircle,
  User,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  Crown,
  Settings,
  Calendar,
  MapPin,
  Euro,
  TrendingUp,
  Award,
  Bell,
  Search,
  Building2,
  Star,
  Power,
  PowerOff,
  Play,
  Pause,
  X,
  Zap,
  Receipt,
  Clock,
  Store,
  Upload,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { ArrowLeft } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { Vehicle } from "@/types";
import brandIcon from "@/assets/Brand_1752260033631.png";
import { DeletionQuestionnaireModal } from "../DeletionQuestionnaireModal";
import ProfessionalVerificationBanner from "../ProfessionalVerificationBanner";
import { ProfessionalVerificationBadge } from "../ProfessionalVerificationBadge";
import { CompanyNameDisplay } from "../CompanyNameDisplay";
import { BoostModal } from "../BoostModal";
import { useQuery } from "@tanstack/react-query";
import { useQuota } from "@/hooks/useQuota";

// Helper function to translate deletion reasons from English to French
const translateDeletionReason = (reason: string): string => {
  const translations: Record<string, string> = {
    sold_on_site: "Vendue via PassionAuto2Roues",
    sold_elsewhere: "Vendue ailleurs",
    no_longer_selling: "Je ne souhaite plus vendre",
    other: "Autre raison",
    admin: "Supprimée par l'administration",
    // Fallback pour les raisons non reconnues
  };

  return translations[reason] || reason;
};

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const baseDashboardTabs: DashboardTab[] = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  { id: "listings", label: "Mes annonces", icon: <Car className="h-5 w-5" /> },
  {
    id: "purchase-history",
    label: "Historique achats",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    id: "favorites",
    label: "Mes favoris",
    icon: <Heart className="h-5 w-5" />,
  },
  {
    id: "messages",
    label: "Messages",
    icon: <MessageCircle className="h-5 w-5" />,
  },
  { id: "profile", label: "Mon profil", icon: <User className="h-5 w-5" /> },
  { id: "premium", label: "Premium", icon: <Crown className="h-5 w-5" /> },
];

// Fonction pour calculer les onglets selon le type d'utilisateur
const getDashboardTabs = (
  userType: string | undefined,
  professionalAccount: any,
): DashboardTab[] => {
  const tabs = [...baseDashboardTabs];

  // Pas d'onglet boutique pro - les infos entreprise sont dans "Mon profil"

  return tabs;
};

interface DashboardProps {
  initialTab?: string;
  onCreateListing?: () => void;
  onRedirectHome?: () => void;
  onRedirectToSearch?: () => void;
  setSearchFilters?: (filters: any) => void;
  setCurrentView?: (view: string) => void;
  refreshVehicles?: boolean; // Propriété pour déclencher le rechargement des annonces
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialTab = "overview",
  onCreateListing,
  onRedirectHome,
  onRedirectToSearch,
  setSearchFilters,
  setCurrentView,
  refreshVehicles,
}) => {
  const {
    vehicles,
    setVehicles,
    setSelectedVehicle,
    setSearchFilters: contextSetSearchFilters,
  } = useApp();
  const { user, profile, loading } = useAuth();
  const isLoading = loading;
  // Note: refreshDbUser n'a pas d'équivalent direct dans AuthContext

  const [userVehiclesWithInactive, setUserVehiclesWithInactive] = useState<
    Vehicle[]
  >([]);
  const [deletedVehicles, setDeletedVehicles] = useState<Vehicle[]>([]);
  const [vehicleToDelete, setVehicleToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [selectedAnnonceToBoost, setSelectedAnnonceToBoost] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  const {
    favorites,
    loading: favoritesLoading,
    toggleFavorite,
    isFavorite,
  } = useFavorites();
  const {
    savedSearches,
    loading: savedSearchesLoading,
    saveSearch,
    deleteSearch,
    toggleAlerts,
  } = useSavedSearches();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingProfile, setEditingProfile] = useState(false);
  const [favoritesSubTab, setFavoritesSubTab] = useState("listings");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [dashboardConversations, setDashboardConversations] = useState<any[]>(
    [],
  );
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    postalCode: "",
    city: "",
    companyName: "",
    address: "",
    website: "",
    description: "",
    companyLogo: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [boostStatuses, setBoostStatuses] = useState<
    Record<string, { isActive: boolean; boostedUntil: string | null }>
  >({});
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loadingPurchaseHistory, setLoadingPurchaseHistory] = useState(false);

  // État pour le filtre des annonces
  const [listingFilter, setListingFilter] = useState<
    "all" | "approved" | "draft" | "pending" | "rejected"
  >("all");

  // États pour la boutique professionnelle
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState({
    company_name: "",
    siret: "",
    company_address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    specialties: [] as string[],
    certifications: [] as string[],
    company_logo: "",
    banner_image: "",
    brand_colors: { primary: "", secondary: "" },
  });
  const [savingShop, setSavingShop] = useState(false);
  const [shopSuccess, setShopSuccess] = useState(false);

  // Hook pour récupérer les informations du compte professionnel
  const { data: professionalAccount } = useQuery({
    queryKey: [`/api/professional-accounts/status/${profile?.id}`],
    enabled: !!profile?.id && profile?.type === "professional",
    staleTime: 30000, // 30 secondes
  });

  // Hook pour récupérer les informations d'abonnement
  const { data: subscriptionInfo } = useQuery({
    queryKey: [`/api/subscriptions/status/${profile?.id}`],
    enabled: !!profile?.id && profile?.type === "professional",
    staleTime: 30000, // 30 secondes
  });

  // Hook pour récupérer les informations de quota
  const { data: quotaInfo } = useQuota(profile?.id);

  // Ces états sont déjà définis plus haut, pas besoin de les redéfinir

  // Hook pour la redirection - DOIT être appelé avant tout return conditionnel
  useEffect(() => {
    if (!user && !profile && !isLoading && onRedirectHome) {
      onRedirectHome();
    }
  }, [user, profile, isLoading, onRedirectHome]);

  // Fonction pour récupérer les véhicules de l'utilisateur (y compris inactifs)
  const fetchUserVehicles = async () => {
    if (!profile?.id) return;

    try {
      console.log("🔄 Récupération des annonces utilisateur...");
      const response = await fetch(`/api/vehicles/user/${profile.id}`, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const userVehicles = await response.json();
        console.log(
          "✅ Véhicules utilisateur récupérés (avec inactifs):",
          userVehicles.length,
        );
        setUserVehiclesWithInactive(userVehicles);
      } else {
        console.error(
          "❌ Erreur récupération véhicules utilisateur:",
          response.status,
        );
        // Fallback vers le filtre classique
        setUserVehiclesWithInactive(
          vehicles.filter((v) => v.userId === profile.id),
        );
      }
    } catch (error) {
      console.error("❌ Erreur réseau véhicules utilisateur:", error);
      // Fallback vers le filtre classique
      setUserVehiclesWithInactive(
        vehicles.filter((v) => v.userId === profile.id),
      );
    }
  };

  // Récupérer les véhicules de l'utilisateur au chargement du composant
  useEffect(() => {
    fetchUserVehicles();
  }, [profile?.id, vehicles]);

  // Effet pour recharger les véhicules lorsque refreshVehicles change
  useEffect(() => {
    if (refreshVehicles && profile?.id) {
      console.log(
        "🔄 Rechargement des annonces après création d'une nouvelle annonce",
      );
      fetchUserVehicles();
    }
  }, [refreshVehicles]);

  // Récupérer les véhicules supprimés de l'utilisateur
  useEffect(() => {
    const fetchDeletedVehicles = async () => {
      if (!profile?.id || activeTab !== "listings") return;

      try {
        const response = await fetch(
          `/api/vehicles/user/${profile.id}/deleted`,
          {
            cache: "no-cache",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        if (response.ok) {
          const deletedData = await response.json();
          console.log("✅ Véhicules supprimés récupérés:", deletedData.length);
          setDeletedVehicles(deletedData);
        } else {
          console.error(
            "❌ Erreur récupération véhicules supprimés:",
            response.status,
          );
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors du chargement des véhicules supprimés:",
          error,
        );
      }
    };

    fetchDeletedVehicles();
  }, [profile?.id, activeTab]);

  // Récupérer les statuts boost quand les véhicules changent
  useEffect(() => {
    if (userVehiclesWithInactive.length > 0) {
      fetchBoostStatuses();
    }
  }, [userVehiclesWithInactive]);

  // Récupérer l'historique des achats quand l'onglet change
  useEffect(() => {
    if (activeTab === "purchase-history" && profile?.id) {
      fetchPurchaseHistory();
    }
  }, [activeTab, profile?.id]);

  // Initialiser le formulaire profil avec les données existantes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        phone: (profile as any)?.phone || "",
        whatsapp: (profile as any)?.whatsapp || "",
        postalCode: (profile as any)?.postal_code || "",
        city: (profile as any)?.city || "",
        companyName: (profile as any)?.company_name || "",
        address: (profile as any)?.address || "",
        website: (profile as any)?.website || "",
        description: (profile as any)?.bio || "",
        companyLogo: (profile as any)?.company_logo || "",
      });
    }
  }, [profile]);

  // Mettre à jour l'onglet actif quand initialTab change
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Initialiser le formulaire boutique avec les données du compte professionnel
  useEffect(() => {
    if (professionalAccount) {
      setShopForm({
        company_name: professionalAccount.company_name || "",
        siret: professionalAccount.siret || "",
        company_address: professionalAccount.company_address || "",
        phone: professionalAccount.phone || "",
        email: professionalAccount.email || "",
        website: professionalAccount.website || "",
        description: professionalAccount.description || "",
        specialties: professionalAccount.specialties || [],
        certifications: professionalAccount.certifications || [],
        company_logo: professionalAccount.company_logo || "",
        banner_image: professionalAccount.banner_image || "",
        brand_colors: professionalAccount.brand_colors || {
          primary: "",
          secondary: "",
        },
      });
    }
  }, [professionalAccount]);

  // Charger les messages pour le dashboard
  useEffect(() => {
    const loadDashboardMessages = async () => {
      if (!profile) return;

      try {
        const response = await fetch(`/api/messages-simple/user/${profile.id}`);
        if (response.ok) {
          const data = await response.json();
          setDashboardConversations(data.conversations || []);
        }
      } catch (error) {
        console.error("Erreur chargement messages dashboard:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadDashboardMessages();
  }, [profile]);

  // Marquer les messages comme lus quand l'utilisateur sélectionne une conversation
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!selectedConversation || !profile) return;

      // Récupérer les IDs des messages non lus reçus par l'utilisateur actuel
      const unreadMessageIds =
        selectedConversation.messages
          ?.filter((msg: any) => !msg.isOwn && !msg.read)
          ?.map((msg: any) => msg.id) || [];

      if (unreadMessageIds.length > 0) {
        try {
          await fetch("/api/messages-simple/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageIds: unreadMessageIds,
              userId: profile.id,
            }),
          });

          console.log(
            "✅ Messages marqués comme lus:",
            unreadMessageIds.length,
          );

          // Actualiser le compteur de messages non lus
          refreshUnreadCount();
        } catch (error) {
          console.error("❌ Erreur marquage messages lus:", error);
        }
      }
    };

    markMessagesAsRead();
  }, [selectedConversation, profile, refreshUnreadCount]);

  // ✅ Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    const loadSelectedConversationMessages = async () => {
      if (!selectedConversation || !profile?.id) return;

      console.log(
        "📬 Chargement messages pour conversation sélectionnée:",
        selectedConversation.id,
      );

      try {
        const messages = await loadConversationMessages(
          selectedConversation.vehicleId,
          selectedConversation.otherUserId,
        );

        // Mettre à jour la conversation sélectionnée avec les messages chargés
        setSelectedConversation((prev: any) => ({
          ...prev,
          messages,
        }));
      } catch (error) {
        console.error("❌ Erreur chargement messages conversation:", error);
      }
    };

    loadSelectedConversationMessages();
  }, [selectedConversation?.id, profile?.id]); // Dépendance sur l'ID de conversation et l'utilisateur

  // Gérer les paramètres URL (tab et notifications)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Gérer le paramètre tab pour navigation directe vers un onglet
    const tabParam = urlParams.get("tab");
    if (
      tabParam &&
      getDashboardTabs(profile?.type, professionalAccount).some(
        (tab) => tab.id === tabParam,
      )
    ) {
      setActiveTab(tabParam);
    }

    // Gérer les notifications d'annulation de boost
    const boostCanceled = urlParams.get("boost_canceled");
    if (boostCanceled === "true") {
      // Afficher une notification d'annulation
      alert(
        "❌ Le paiement du boost a été annulé. Votre annonce n'a pas été boostée.",
      );

      // Nettoyer l'URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [profile?.type, professionalAccount]); // Se déclenche quand les données utilisateur sont chargées

  // Pré-remplir le formulaire avec les données existantes quand on entre en mode édition
  useEffect(() => {
    if (editingProfile && profile) {
      setProfileForm({
        name: profile.name || "",
        phone: (profile as any)?.phone || "",
        whatsapp: (profile as any)?.whatsapp || "",
        postalCode: (profile as any)?.postal_code || "",
        city: (profile as any)?.city || "",
        companyName: (profile as any)?.company_name || "",
        address: (profile as any)?.address || "",
        website: (profile as any)?.website || "",
        description: (profile as any)?.bio || "",
        companyLogo: (profile as any)?.company_logo || "",
      });
    }
  }, [editingProfile, profile]);

  // Fonction pour sauvegarder le profil
  const handleSaveProfile = async () => {
    if (!profile?.id || savingProfile) return;

    setSavingProfile(true);
    try {
      // Mapper les champs du formulaire vers les noms de colonnes de la base
      const apiData = {
        ...profileForm,
        bio: profileForm.description, // Mapper description vers bio
        company_logo: profileForm.companyLogo, // Mapper companyLogo vers company_logo
      };
      delete apiData.description; // Supprimer le champ description
      delete apiData.companyLogo; // Supprimer le champ companyLogo

      const response = await fetch(`/api/profile/update/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        console.log("✅ Profil sauvegardé avec succès:", updatedData);
        setEditingProfile(false);
        setProfileSuccess(true);
        // Masquer le message de succès après 3 secondes
        setTimeout(() => setProfileSuccess(false), 3000);
        // Rafraîchir les données utilisateur pour refléter les changements
        // Note: refreshDbUser n'est plus disponible dans AuthContext
        // Important: Mettre à jour le formulaire local avec les nouvelles données
        setProfileForm({
          name: updatedData.name || "",
          phone: updatedData.phone || "",
          whatsapp: updatedData.whatsapp || "",
          postalCode: updatedData.postal_code || "",
          city: updatedData.city || "",
          companyName: updatedData.company_name || "",
          address: updatedData.address || "",
          website: updatedData.website || "",
          description: updatedData.bio || "",
          companyLogo: updatedData.company_logo || "",
        });
      } else {
        const errorData = await response.json();
        console.error("❌ Erreur lors de la sauvegarde du profil:", errorData);
        alert(
          `Erreur lors de la sauvegarde: ${errorData.error || "Erreur inconnue"}`,
        );
      }
    } catch (error) {
      console.error("❌ Erreur réseau sauvegarde profil:", error);
      alert("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !profile ||
      sendingMessage ||
      !selectedConversation
    )
      return;

    console.log("📤 Envoi message:", {
      from: profile.id,
      to: selectedConversation.otherUserId,
      vehicle: selectedConversation.vehicleId,
      content: newMessage,
    });

    setSendingMessage(true);
    try {
      const response = await fetch("/api/messages-simple/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUserId: profile.id,
          toUserId: selectedConversation.otherUserId, // ✅ Utilisateur spécifique
          content: newMessage,
          vehicleId: selectedConversation.vehicleId, // ✅ Annonce spécifique
        }),
      });

      if (response.ok) {
        console.log("✅ Message envoyé avec succès");
        setNewMessage("");

        // ✅ Recharger les messages de la conversation active
        const updatedMessages = await loadConversationMessages(
          selectedConversation.vehicleId,
          selectedConversation.otherUserId,
        );

        // Mettre à jour la conversation sélectionnée avec les nouveaux messages
        setSelectedConversation((prev: any) => ({
          ...prev,
          messages: updatedMessages,
        }));

        // Recharger aussi la liste des conversations pour mettre à jour le dernier message
        const refreshResponse = await fetch(
          `/api/messages-simple/user/${profile.id}`,
        );
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setDashboardConversations(data.conversations || []);
        }

        console.log("✅ Message envoyé et conversations mises à jour");
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur envoi message:", response.status, errorText);
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // ✅ Fonction pour charger les messages d'une conversation spécifique
  const loadConversationMessages = async (
    vehicleId: string,
    otherUserId: string,
  ) => {
    if (!profile?.id) return [];

    try {
      console.log("📬 Chargement messages conversation:", {
        vehicleId,
        otherUserId,
        currentUserId: profile.id,
      });

      const response = await fetch("/api/messages-simple/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: parseInt(vehicleId), // S'assurer que c'est un nombre
          user1Id: profile.id,
          user2Id: otherUserId,
        }),
      });

      if (response.ok) {
        const messages = await response.json();
        console.log(
          `✅ ${messages.length} messages chargés pour la conversation`,
        );

        // Formater les messages pour l'affichage
        return messages.map((msg: any) => ({
          id: msg.id,
          sender:
            msg.from_user_id === profile.id
              ? "Vous"
              : msg.sender_name || "Autre utilisateur",
          isOwn: msg.from_user_id === profile.id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          sender_name: msg.sender_name,
          sender_avatar: msg.sender_avatar,
          read: msg.read,
        }));
      } else {
        const errorData = await response.json();
        console.error(
          "❌ Erreur chargement messages:",
          response.status,
          errorData,
        );
      }
    } catch (error) {
      console.error("❌ Erreur chargement messages conversation:", error);
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-2xl shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary-bolt-500 border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chargement...
          </h2>
          <p className="text-gray-600">Accès à votre tableau de bord</p>
        </div>
      </div>
    );
  }

  if (!user && !profile && !isLoading) {
    return null; // Ne rien afficher pendant la redirection
  }

  // Utiliser les véhicules avec inactifs pour le Dashboard, ou fallback vers le filtre classique
  const userVehicles =
    userVehiclesWithInactive.length > 0
      ? userVehiclesWithInactive
      : vehicles.filter((v) => v.userId === profile?.id);
  const totalViews = userVehicles.reduce((sum, v) => sum + v.views, 0);
  const totalFavorites = userVehicles.reduce((sum, v) => sum + v.favorites, 0);
  const premiumListings = userVehicles.filter((v) => v.isPremium).length;

  // Fonction pour ouvrir le questionnaire de suppression
  const openDeletionModal = (vehicleId: string, vehicleTitle: string) => {
    setVehicleToDelete({ id: vehicleId, title: vehicleTitle });
    setIsDeletionModalOpen(true);
  };

  // Fonction appelée après confirmation du questionnaire
  const handleDeleteConfirmed = () => {
    if (vehicleToDelete) {
      // Supprimer de l'état local immédiatement (le soft delete a déjà été fait côté serveur)
      setVehicles(vehicles.filter((v) => v.id !== vehicleToDelete.id));
      setUserVehiclesWithInactive(
        userVehiclesWithInactive.filter((v) => v.id !== vehicleToDelete.id),
      );
      console.log(`✅ Annonce ${vehicleToDelete.id} supprimée avec succès`);

      // Réinitialiser l'état
      setVehicleToDelete(null);
      setIsDeletionModalOpen(false);
    }
  };

  // Fonctions pour le modal boost
  const openBoostModal = (annonceId: string, annonceTitle: string) => {
    setSelectedAnnonceToBoost({ id: annonceId, title: annonceTitle });
    setBoostModalOpen(true);
  };

  const closeBoostModal = () => {
    setBoostModalOpen(false);
    setSelectedAnnonceToBoost(null);
  };

  // Fonction pour récupérer les statuts boost
  const fetchBoostStatuses = async () => {
    if (!userVehicles.length) return;

    const statuses: Record<
      string,
      { isActive: boolean; boostedUntil: string | null }
    > = {};

    for (const vehicle of userVehicles) {
      try {
        const response = await fetch(`/api/boost/status/${vehicle.id}`);
        if (response.ok) {
          const status = await response.json();
          statuses[vehicle.id] = status;
        }
      } catch (error) {
        console.error(`Error fetching boost status for ${vehicle.id}:`, error);
        statuses[vehicle.id] = { isActive: false, boostedUntil: null };
      }
    }

    setBoostStatuses(statuses);
  };

  // Fonction pour récupérer l'historique des achats
  const fetchPurchaseHistory = async () => {
    if (!profile?.id) return;

    setLoadingPurchaseHistory(true);
    try {
      const response = await fetch(`/api/purchase-history/user/${profile.id}`);
      if (response.ok) {
        const history = await response.json();
        setPurchaseHistory(history);
      } else {
        console.error("Error fetching purchase history");
        setPurchaseHistory([]);
      }
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      setPurchaseHistory([]);
    } finally {
      setLoadingPurchaseHistory(false);
    }
  };

  // Fonction pour sauvegarder la boutique professionnelle
  const handleSaveShop = async () => {
    if (!profile?.id || !professionalAccount?.id || savingShop) return;

    setSavingShop(true);
    try {
      const response = await fetch(
        `/api/professional-accounts/${professionalAccount.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shopForm),
        },
      );

      if (response.ok) {
        const updatedData = await response.json();
        console.log("✅ Boutique sauvegardée avec succès:", updatedData);
        setEditingShop(false);
        setShopSuccess(true);
        // Masquer le message de succès après 3 secondes
        setTimeout(() => setShopSuccess(false), 3000);
        // Pas besoin de refresher profile ici car les données boutique sont séparées
      } else {
        const errorData = await response.json();
        console.error(
          "❌ Erreur lors de la sauvegarde de la boutique:",
          errorData,
        );
        alert(
          `Erreur lors de la sauvegarde: ${errorData.error || "Erreur inconnue"}`,
        );
      }
    } catch (error) {
      console.error("❌ Erreur réseau sauvegarde boutique:", error);
      alert("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSavingShop(false);
    }
  };

  const handleDeleteListing = async (vehicleId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.",
      )
    ) {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Suppression réussie, mettre à jour l'état local
          setVehicles(vehicles.filter((v) => v.id !== vehicleId));
          setUserVehiclesWithInactive(
            userVehiclesWithInactive.filter((v) => v.id !== vehicleId),
          );
          console.log(`✅ Annonce ${vehicleId} supprimée avec succès`);
        } else {
          const errorData = await response.json();
          console.error("❌ Erreur suppression API:", errorData);
          alert(
            "Erreur lors de la suppression de l'annonce. Veuillez réessayer.",
          );
        }
      } catch (error) {
        console.error("❌ Erreur lors de la suppression:", error);
        alert("Erreur de connexion. Veuillez réessayer.");
      }
    }
  };

  const handleToggleActiveListing = async (
    vehicleId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/annonces/${vehicleId}/toggle-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        // Mettre à jour localement
        setVehicles(
          vehicles.map((v) =>
            v.id === vehicleId ? { ...v, isActive: !currentStatus } : v,
          ),
        );

        // Afficher un message de confirmation
        console.log(
          `Annonce ${vehicleId} ${!currentStatus ? "activée" : "désactivée"} avec succès`,
        );
      } else {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);

        // Pour l'instant, simuler le changement en attendant la correction de la DB
        setVehicles(
          vehicles.map((v) =>
            v.id === vehicleId ? { ...v, isActive: !currentStatus } : v,
          ),
        );
        console.log(`Changement de statut simulé pour l'annonce ${vehicleId}`);
      }
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);

      // Fallback: mettre à jour localement même en cas d'erreur API
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, isActive: !currentStatus } : v,
        ),
      );
      console.log(`Changement de statut local pour l'annonce ${vehicleId}`);
    }
  };

  const handleCreateListing = () => {
    if (onCreateListing) {
      onCreateListing();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderMessages = () => {
    if (loadingMessages) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-teal-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement des messages...</p>
          </div>
        </div>
      );
    }

    const messages = dashboardConversations.map((conv: any) => {
      const other = conv.other_user || {};
      const avatarUrl =
        other.avatar ||
        (other.type === "professional" ? other.company_logo : null);

      const initials = (other.name || "")
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return {
        id: conv.id, // ✅ ID canonique fourni par le serveur
        fromUser: other.name,
        userType: other.type || "individual", // ✅ Type utilisateur pour les badges
        vehicleTitle: conv.vehicle_title,
        vehicleId: conv.vehicle_id,
        otherUserId: conv.other_user_id || other.id,
        lastMessage: conv.last_message,
        timestamp: new Date(conv.last_message_at || new Date()),
        unread: conv.unread_count > 0,
        avatarUrl, // ✅ nouvelle propriété
        initials, // ✅ fallback
        messages: [], // Sera chargé à la sélection de la conversation
      };
    });

    const currentConversation = dashboardConversations[0]
      ? (() => {
          const c = dashboardConversations[0];
          const other = c.other_user || {};
          const avatarUrl =
            other.avatar ||
            (other.type === "professional" ? other.company_logo : null);
          const initials = (other.name || "")
            .trim()
            .split(/\s+/)
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return {
            id: c.id, // ✅ ID canonique du serveur
            fromUser: other.name,
            userType: other.type || "individual", // ✅ Type utilisateur
            vehicleTitle: c.vehicle_title,
            vehicleId: c.vehicle_id,
            otherUserId: c.other_user_id || other.id,
            avatarUrl, // ✅
            initials, // ✅
            messages: [], // Sera chargé à la sélection
          };
        })()
      : null;

    const activeConversation = selectedConversation || currentConversation;

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Gérez vos conversations !
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className="inline-flex items-center px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-sm font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Retour au tableau de bord</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px] max-h-[calc(100vh-300px)] mb-8">
          {/* Liste des conversations */}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Conversations</h2>
            </div>
            <div className="overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune conversation</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Les messages des acheteurs apparaîtront ici
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      console.log("🔄 Sélection conversation:", message.id);
                      setSelectedConversation(message);
                    }}
                    className={`p-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      activeConversation?.id === message.id
                        ? "bg-primary-bolt-50 border-r-4 border-r-primary-bolt-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                        {message.avatarUrl ? (
                          <img
                            src={message.avatarUrl}
                            alt={message.fromUser}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 flex items-center justify-center text-white font-semibold">
                            {message.initials}
                          </div>
                        )}
                      </div>

                      {/* Infos conversation */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          {/* Nom de l'utilisateur + badge type */}
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">
                              {message.fromUser}
                            </h3>
                            {/* Badge type utilisateur */}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                message.userType === "professional"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {message.userType === "professional"
                                ? "Pro"
                                : "Part."}
                            </span>
                          </div>
                          {message.unread && (
                            <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
                          )}
                        </div>

                        {/* Titre de l’annonce → lien cliquable */}
                        <a
                          href={`/?vehicle=${message.vehicleId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 mb-1 hover:underline block"
                        >
                          📝 {message.vehicleTitle}
                        </a>

                        {/* Date et heure du dernier message */}
                        <p className="text-xs text-gray-400 mt-1">
                          {message.timestamp.toLocaleDateString("fr-FR")} à{" "}
                          {message.timestamp.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Zone de conversation */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col">
            {activeConversation ? (
              <div className="flex flex-col h-full">
                {/* Header de la conversation */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-bolt-50 to-primary-bolt-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                      {activeConversation.avatarUrl ? (
                        <img
                          src={activeConversation.avatarUrl}
                          alt={activeConversation.fromUser}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 flex items-center justify-center text-white font-semibold">
                          {activeConversation.initials ||
                            activeConversation.fromUser
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {activeConversation.fromUser}
                      </h3>
                      <a
                        href={`/?vehicle=${activeConversation.vehicleId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:underline"
                      >
                        {activeConversation.vehicleTitle}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  id="messages-container"
                  className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-400px)]"
                >
                  {[...activeConversation.messages]
                    .sort(
                      (a, b) =>
                        new Date(a.timestamp).getTime() -
                        new Date(b.timestamp).getTime(),
                    )
                    .map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-sm px-4 py-3 rounded-2xl ${
                            msg.isOwn
                              ? "bg-primary-bolt-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {/* Nom de l'expéditeur */}
                          <p
                            className={`text-xs font-semibold mb-1 ${
                              msg.isOwn
                                ? "text-primary-bolt-100"
                                : "text-gray-600"
                            }`}
                          >
                            {msg.isOwn ? "Vous" : activeConversation.fromUser}
                          </p>

                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              msg.isOwn
                                ? "text-primary-bolt-100"
                                : "text-gray-500"
                            }`}
                          >
                            {msg.timestamp
                              ? `${msg.timestamp.toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })} à ${msg.timestamp.toLocaleTimeString(
                                  "fr-FR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Zone de saisie */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        !sendingMessage &&
                        handleSendMessage()
                      }
                      placeholder="Tapez votre message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-primary-bolt-500 hover:bg-primary-bolt-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      {sendingMessage ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-gray-600">
                    Choisissez une conversation pour commencer à échanger.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  <ProfileSection
    profile={profile}
    user={user}
    profileForm={profileForm}
    setProfileForm={setProfileForm}
    editingProfile={editingProfile}
    setEditingProfile={setEditingProfile}
    profileSuccess={profileSuccess}
    savingProfile={savingProfile}
    handleSaveProfile={handleSaveProfile}
    // refreshDbUser={refreshDbUser} // Non disponible dans AuthContext
  />;

  const renderPurchaseHistory = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historique des achats
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Consultez tous vos achats de boost et abonnements
          </p>
        </div>
      </div>

      {loadingPurchaseHistory ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Receipt className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Chargement de l'historique...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {purchaseHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun achat
              </h3>
              <p className="text-gray-600">
                Vous n'avez encore effectué aucun achat de boost ou
                d'abonnement.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Historique complet
                </h2>
                <p className="text-gray-600 mt-1">
                  {purchaseHistory.length} achat
                  {purchaseHistory.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {purchaseHistory.map((purchase, index) => (
                  <div
                    key={purchase.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-full ${
                            purchase.type === "boost"
                              ? "bg-orange-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {purchase.type === "boost" ? (
                            <Zap
                              className={`h-6 w-6 ${
                                purchase.type === "boost"
                                  ? "text-orange-600"
                                  : "text-blue-600"
                              }`}
                            />
                          ) : (
                            <Crown className="h-6 w-6 text-blue-600" />
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {purchase.title}
                          </h3>
                          <p className="text-gray-600">
                            {purchase.description}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(purchase.date).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {purchase.amount.toFixed(2)}€
                        </div>
                        <div
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            purchase.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : purchase.status === "active"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {purchase.status === "completed"
                            ? "Completé"
                            : purchase.status === "active"
                              ? "Actif"
                              : purchase.status}
                        </div>
                      </div>
                    </div>

                    {purchase.type === "boost" && purchase.duration && (
                      <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          Durée: {purchase.duration} jour
                          {purchase.duration !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSubscription = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Building2 className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Abonnement Professionnel
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Gérez votre abonnement et découvrez tous les avantages
        </p>

        {/* Boutons d'actions professionnelles */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 max-w-4xl mx-auto">
          <button
            onClick={() => {
              // Utiliser directement l'UID utilisateur
              if (profile?.id) {
                window.open(`/pro/${profile.id}`, "_blank");
              } else {
                console.error("ID utilisateur non disponible");
              }
            }}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            <Eye className="h-5 w-5" />
            <span>Voir ma boutique publique</span>
          </button>

          <button
            onClick={() => {
              if (setCurrentView) setCurrentView("subscription-purchase");
            }}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            <Crown className="h-5 w-5" />
            <span>Gérer mon abonnement</span>
          </button>
        </div>
      </div>

      {/* Avantages de l'abonnement Pro */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Crown className="h-6 w-6 text-yellow-500 mr-3" />
          Vos avantages Pro actuels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900">
                Boutique personnalisée
              </h3>
            </div>
            <p className="text-gray-600">
              Votre propre page boutique avec tous vos véhicules
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900">
                Visibilité premium
              </h3>
            </div>
            <p className="text-gray-600">
              Vos annonces remontent automatiquement dans les résultats
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900">
                Badge vérifié
              </h3>
            </div>
            <p className="text-gray-600">
              Affichez votre statut de professionnel vérifié
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900">
                Annonces illimitées
              </h3>
            </div>
            <p className="text-gray-600">
              Publiez autant d'annonces que vous le souhaitez
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900">
                Support prioritaire
              </h3>
            </div>
            <p className="text-gray-600">
              Assistance dédiée pour les professionnels
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Euro className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-900">
                Tarifs préférentiels
              </h3>
            </div>
            <p className="text-gray-600">Réductions sur les options premium</p>
          </div>
        </div>
      </div>

      {/* Plans d'abonnement disponibles */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Choisissez votre plan d'abonnement
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Starter Pro */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Starter Pro
              </h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                19,90€
              </div>
              <p className="text-gray-600">par mois</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Jusqu'à 20 annonces simultanées</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Page boutique personnalisée</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Badge professionnel vérifié</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Support par email</span>
              </li>
            </ul>
          </div>

          {/* Business Pro */}
          <div className="bg-white rounded-2xl border-2 border-orange-300 p-8 relative hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Business Pro
              </h3>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                39,90€
              </div>
              <p className="text-gray-600">par mois</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Jusqu'à 50 annonces simultanées</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Remontée automatique hebdomadaire</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Statistiques détaillées</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Support téléphonique</span>
              </li>
            </ul>
          </div>

          {/* Premium Pro */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Premium Pro
              </h3>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                79,90€
              </div>
              <p className="text-gray-600">par mois</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Annonces illimitées</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Remontée quotidienne automatique</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Analytics avancés</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Gestionnaire de compte dédié</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPremium = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Options Premium</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Boostez la visibilité de vos annonces
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Daily Boost */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Remontée quotidienne
            </h3>
            <div className="text-4xl font-bold text-primary-bolt-500 mb-3">
              2€
            </div>
            <p className="text-gray-600">Remontée automatique pendant 24h</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
              <span className="font-medium">Remontée en tête de liste</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
              <span className="font-medium">Badge "Boosté"</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
              <span className="font-medium">Visibilité accrue</span>
            </li>
          </ul>
        </div>

        {/* Weekly Premium */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8 relative hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center mb-8 mt-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Pack Hebdomadaire
            </h3>
            <div className="text-4xl font-bold text-orange-600 mb-3">4,99€</div>
            <p className="text-gray-600">Mise en avant pendant 7 jours</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="font-medium">Mise en avant 7 jours</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="font-medium">Badge "Boosté"</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="font-medium">Statistiques détaillées</span>
            </li>
          </ul>
        </div>

        {/* Monthly Pro */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Pack Pro Mensuel
            </h3>
            <div className="text-4xl font-bold text-purple-600 mb-3">
              19,99€
            </div>
            <p className="text-gray-600">Solution complète pour pros</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-medium">10 annonces en avant</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-medium">Statistiques avancées</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-medium">Support prioritaire</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Current Premium Status */}
      {premiumListings > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-full shadow-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-orange-900">
                  Statut Premium Actif
                </h3>
                <p className="text-orange-700 text-lg">
                  Vous avez {premiumListings} annonce
                  {premiumListings > 1 ? "s" : ""} premium active
                  {premiumListings > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              Gérer
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderFavoriteListings = () => (
    <div className="space-y-6">
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune annonce favorite
          </h3>
          <p className="text-gray-600">
            Ajoutez des annonces à vos favoris pour les retrouver facilement
            ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <img
                      src={brandIcon}
                      alt="Brand icon"
                      className="w-20 h-20 opacity-60"
                    />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(listing.id);
                  }}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {listing.title}
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-bolt-600">
                      {formatPrice(listing.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {listing.year}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {listing.mileage
                        ? `${listing.mileage.toLocaleString()} km`
                        : "N/A"}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {listing.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Ajouté le{" "}
                    {new Date(listing.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <button
                    onClick={() => {
                      // Trouver le véhicule complet dans la liste
                      const fullVehicle = vehicles.find(
                        (v) => v.id === listing.id,
                      );
                      if (fullVehicle) {
                        setSelectedVehicle(fullVehicle);
                      }
                    }}
                    className="bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Voir l'annonce
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSavedSearches = () => {
    if (savedSearchesLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Search className="h-12 w-12 text-primary-bolt-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">
              Chargement des recherches sauvegardées...
            </p>
          </div>
        </div>
      );
    }

    const handleExecuteSearch = (searchId: string) => {
      const search = savedSearches.find((s) => s.id === searchId);
      if (search) {
        // Appliquer les filtres de recherche sauvegardée
        const searchFunction = setSearchFilters || contextSetSearchFilters;
        if (searchFunction) {
          console.log(
            "🔍 Application des filtres de recherche sauvegardée:",
            search.filters,
          );
          searchFunction(search.filters);
        }
        // Rediriger vers la page de recherche (pas la page d'accueil)
        if (onRedirectToSearch) {
          onRedirectToSearch();
        } else if (onRedirectHome) {
          // Fallback vers la page d'accueil si onRedirectToSearch n'est pas disponible
          onRedirectHome();
        }
      }
    };

    const handleDeleteSavedSearch = async (searchId: string) => {
      if (
        window.confirm(
          "Êtes-vous sûr de vouloir supprimer cette recherche sauvegardée ?",
        )
      ) {
        try {
          await deleteSearch(searchId);
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
        }
      }
    };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Recherches sauvegardées
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {savedSearches.length} recherche
            {savedSearches.length !== 1 ? "s" : ""} sauvegardée
            {savedSearches.length !== 1 ? "s" : ""}
          </p>
        </div>

        {savedSearches.length > 0 ? (
          <div className="grid gap-6">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {search.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {search.filters.category && (
                        <span className="px-3 py-1 bg-primary-bolt-100 text-primary-bolt-700 rounded-full text-sm font-medium">
                          📂 {search.filters.category}
                        </span>
                      )}
                      {search.filters.subcategory && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          🔖 {search.filters.subcategory}
                        </span>
                      )}
                      {search.filters.brand && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          🏷️ {search.filters.brand}
                        </span>
                      )}
                      {search.filters.model && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                          🚗 {search.filters.model}
                        </span>
                      )}
                      {(search.filters.priceFrom || search.filters.priceTo) && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          💰{" "}
                          {search.filters.priceFrom
                            ? formatPrice(search.filters.priceFrom)
                            : "0"}{" "}
                          -{" "}
                          {search.filters.priceTo
                            ? formatPrice(search.filters.priceTo)
                            : "∞"}
                        </span>
                      )}
                      {(search.filters.yearFrom || search.filters.yearTo) && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          📅 {search.filters.yearFrom || "1900"} -{" "}
                          {search.filters.yearTo || new Date().getFullYear()}
                        </span>
                      )}
                      {(search.filters.mileageFrom ||
                        search.filters.mileageTo) && (
                        <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
                          🛣️ {search.filters.mileageFrom || "0"} -{" "}
                          {search.filters.mileageTo || "∞"} km
                        </span>
                      )}
                      {search.filters.fuelType && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          ⛽ {search.filters.fuelType}
                        </span>
                      )}
                      {search.filters.condition && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          🔧 {search.filters.condition}
                        </span>
                      )}
                      {search.filters.location && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          📍 {search.filters.location}
                        </span>
                      )}
                      {search.filters.searchTerm && (
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                          🔍 "{search.filters.searchTerm}"
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Créée le{" "}
                      {new Date(search.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        toggleAlerts(search.id, !search.alerts_enabled)
                      }
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        search.alerts_enabled
                          ? "bg-primary-bolt-100 text-primary-bolt-600 hover:bg-primary-bolt-200"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      title={
                        search.alerts_enabled
                          ? "Désactiver les alertes"
                          : "Activer les alertes"
                      }
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        search.alerts_enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {search.alerts_enabled
                        ? "🔔 Alertes actives"
                        : "🔕 Alertes désactivées"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExecuteSearch(search.id)}
                      className="px-4 py-2 bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Exécuter</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedSearch(search.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-bolt-100 to-primary-bolt-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <Search className="h-12 w-12 text-primary-bolt-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Aucune recherche sauvegardée
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Sauvegardez vos recherches pour être alerté des nouvelles
              annonces.
            </p>
            <button
              onClick={onRedirectHome}
              className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-10 py-4 rounded-xl font-semibold flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              <Search className="h-6 w-6" />
              <span>Faire une recherche</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFavoriteSearches = () => (
    <div className="space-y-6">
      {savedSearches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune recherche favorite
          </h3>
          <p className="text-gray-600">
            Sauvegardez vos recherches pour recevoir des alertes automatiques.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="font-bold text-lg text-gray-900">
                      {search.name}
                    </h3>
                    {search.alerts_enabled && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Alertes actives
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-2">
                      {search.filters &&
                        typeof search.filters === "object" &&
                        Object.entries(search.filters).map(([key, value]) => (
                          <span
                            key={key}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {key === "priceMax" &&
                              `< ${formatPrice(value as number)}`}
                            {key === "yearMin" && `À partir de ${value}`}
                            {key !== "priceMax" &&
                              key !== "yearMin" &&
                              String(value)}
                          </span>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      Créée le{" "}
                      {new Date(search.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      toggleAlerts(search.id, !search.alerts_enabled)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      search.alerts_enabled
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Bell className="h-4 w-4 mr-1 inline" />
                    {search.alerts_enabled ? "Alertes ON" : "Alertes OFF"}
                  </button>
                  <button className="bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Rechercher
                  </button>
                  <button
                    onClick={() => deleteSearch(search.id)}
                    className="text-red-500 hover:text-red-600 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDeletedListings = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Annonces supprimées ({deletedVehicles.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Historique de vos annonces supprimées avec les raisons de
            suppression
          </p>
        </div>
      </div>

      {deletedVehicles.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune annonce supprimée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez encore supprimé aucune annonce.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deletedVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm opacity-75"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {vehicle.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {vehicle.brand} {vehicle.model} • {vehicle.year}
                  </p>
                </div>
                <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                  Supprimée
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Prix :
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {vehicle.price.toLocaleString()} €
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Supprimée le :
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {(vehicle as any).deletedAt
                      ? new Date((vehicle as any).deletedAt).toLocaleDateString(
                          "fr-FR",
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>

              {vehicle.deletionReason && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Raison de suppression :
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {vehicle.deletionReason}
                  </p>
                  {vehicle.deletionComment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      "{vehicle.deletionComment}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Fonction pour afficher la boutique professionnelle
  const renderProfessionalShop = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ma boutique pro</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Gérez les informations de votre boutique professionnelle
          </p>
        </div>
        <button
          onClick={() => setEditingShop(!editingShop)}
          className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Edit className="h-4 w-4" />
          <span>{editingShop ? "Annuler" : "Modifier"}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Message de succès */}
        {shopSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-green-800 font-medium">
              Boutique mise à jour avec succès !
            </p>
          </div>
        )}

        {editingShop ? (
          /* Mode édition */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={shopForm.company_name}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, company_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIRET
                </label>
                <input
                  type="text"
                  value={shopForm.siret}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, siret: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={shopForm.phone}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email professionnel
                </label>
                <input
                  type="email"
                  value={shopForm.email}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  value={shopForm.website}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, website: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de l'entreprise
                </label>
                <textarea
                  value={shopForm.company_address}
                  onChange={(e) =>
                    setShopForm({
                      ...shopForm,
                      company_address: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'entreprise
                </label>
                <textarea
                  value={shopForm.description}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                  placeholder="Décrivez votre entreprise, vos services..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                onClick={() => setEditingShop(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveShop}
                disabled={savingShop}
                className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {savingShop ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        ) : (
          /* Mode lecture */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Informations générales
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nom de l'entreprise
                      </label>
                      <p className="text-gray-900 font-medium">
                        {shopForm.company_name || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        SIRET
                      </label>
                      <p className="text-gray-900">
                        {shopForm.siret || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Téléphone
                      </label>
                      <p className="text-gray-900">
                        {shopForm.phone || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email professionnel
                      </label>
                      <p className="text-gray-900">
                        {shopForm.email || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Site web
                      </label>
                      <p className="text-gray-900">
                        {shopForm.website ? (
                          <a
                            href={shopForm.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-bolt-600 hover:underline"
                          >
                            {shopForm.website}
                          </a>
                        ) : (
                          "Non renseigné"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Adresse
                  </h3>
                  <p className="text-gray-900 whitespace-pre-line">
                    {shopForm.company_address || "Non renseignée"}
                  </p>
                </div>
              </div>
            </div>

            {shopForm.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {shopForm.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderFavorites = () => {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-4 rounded-full shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes favoris</h1>
              <p className="text-gray-600 text-lg">
                Retrouvez tous vos contenus favoris
              </p>
            </div>
          </div>

          {/* Sub-tabs horizontaux */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFavoritesSubTab("listings")}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex-1 justify-center ${
                favoritesSubTab === "listings"
                  ? "bg-white text-primary-bolt-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Annonces favorites</span>
            </button>
            <button
              onClick={() => setFavoritesSubTab("searches")}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex-1 justify-center ${
                favoritesSubTab === "searches"
                  ? "bg-white text-primary-bolt-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Recherches sauvegardées</span>
            </button>
          </div>
        </div>

        {/* Content based on active sub-tab */}
        {favoritesSubTab === "listings" && renderFavoriteListings()}
        {favoritesSubTab === "searches" && renderSavedSearches()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation - masquée si onglet messages */}
          {activeTab !== "messages" && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-primary-bolt-50 to-primary-bolt-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xl">
                          {(profile?.name || user?.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {profile?.name ||
                          user?.email?.split("@")[0] ||
                          "Utilisateur"}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {profile?.type === "professional"
                          ? "🏢 Professionnel"
                          : "👤 Particulier"}
                      </p>
                    </div>
                  </div>
                </div>

                <nav className="p-4">
                  {getDashboardTabs(profile?.type, professionalAccount)
                    .filter((tab) => {
                      // Masquer les onglets pros pour les utilisateurs individuels
                      if (
                        (tab.id === "subscription" ||
                          tab.id === "manage-subscription") &&
                        profile?.type !== "professional"
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((tab) => {
                      const badgeCount =
                        tab.id === "messages" ? unreadCount : tab.badge || 0;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-left transition-all duration-200 mb-2 ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 text-white shadow-lg transform scale-105"
                              : "text-gray-700 hover:bg-gray-50 hover:text-primary-bolt-500"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {tab.icon}
                            <span className="font-semibold">{tab.label}</span>
                          </div>
                          {badgeCount > 0 && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                activeTab === tab.id
                                  ? "bg-white/20 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {badgeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content - plein largeur si messages */}
          <div className={activeTab === "messages" ? "w-full" : "flex-1"}>
            {activeTab === "overview" && (
              <OverviewSection
                profile={profile}
                user={user}
                professionalAccount={professionalAccount}
                subscriptionInfo={subscriptionInfo}
                userVehicles={userVehicles}
                totalViews={totalViews}
                totalFavorites={totalFavorites}
                premiumListings={premiumListings}
                onCreateListing={handleCreateListing}
                formatPrice={formatPrice}
              />
            )}

            {activeTab === "listings" && (
              <ListingsSection
                userVehicles={userVehicles}
                deletedVehicles={deletedVehicles}
                listingFilter={listingFilter}
                setListingFilter={setListingFilter}
                profile={profile}
                quotaInfo={quotaInfo}
                brandIcon={brandIcon}
                boostStatuses={boostStatuses}
                onCreateListing={handleCreateListing}
                openBoostModal={openBoostModal}
                openDeletionModal={openDeletionModal}
                formatPrice={formatPrice}
                getFilterLabel={getFilterLabel}
                getFilterDescription={getFilterDescription}
                getEmptyStateTitle={getEmptyStateTitle}
                getEmptyStateDescription={getEmptyStateDescription}
                translateDeletionReason={translateDeletionReason}
              />
            )}

            {activeTab === "purchase-history" && renderPurchaseHistory()}
            {activeTab === "favorites" && renderFavorites()}
            {activeTab === "messages" && (
              <MessagesSection
                loadingMessages={loadingMessages}
                dashboardConversations={dashboardConversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                setActiveTab={setActiveTab}
                //activeConversation={activeConversation}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendingMessage={sendingMessage}
                handleSendMessage={handleSendMessage}
              />
            )}

            {activeTab === "profile" && (
              <ProfileSection
                profile={profile}
                user={user}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                editingProfile={editingProfile}
                setEditingProfile={setEditingProfile}
                profileSuccess={profileSuccess}
                savingProfile={savingProfile}
                handleSaveProfile={handleSaveProfile}
                // refreshDbUser={refreshDbUser} // Non disponible dans AuthContext
              />
            )}

            {activeTab === "premium" && renderPremium()}
          </div>
        </div>
      </div>

      {/* Modal de questionnaire de suppression */}
      {vehicleToDelete && (
        <DeletionQuestionnaireModal
          isOpen={isDeletionModalOpen}
          onClose={() => {
            setIsDeletionModalOpen(false);
            setVehicleToDelete(null);
          }}
          vehicleTitle={vehicleToDelete.title}
          vehicleId={vehicleToDelete.id}
          onDeleteConfirmed={handleDeleteConfirmed}
        />
      )}

      {/* Modal de boost d'annonce */}
      {selectedAnnonceToBoost && (
        <BoostModal
          isOpen={boostModalOpen}
          onClose={closeBoostModal}
          annonceId={selectedAnnonceToBoost.id}
          annonceTitle={selectedAnnonceToBoost.title}
        />
      )}
    </div>
  );
};

// Fonctions utilitaires pour les filtres
const getFilterLabel = (filter: string) => {
  switch (filter) {
    case "approved":
      return "approuvées";
    case "pending":
      return "en attente";
    case "rejected":
      return "rejetées";
    default:
      return "";
  }
};

const getFilterDescription = (filter: string, count: number) => {
  switch (filter) {
    case "all":
      return `Toutes les annonces (${count} au total)`;
    case "approved":
      return `Annonces approuvées et visibles publiquement (${count})`;
    case "pending":
      return `Annonces en attente de validation par l'admin (${count})`;
    case "rejected":
      return `Annonces refusées par l'admin (${count})`;
    default:
      return `${count} annonce${count !== 1 ? "s" : ""}`;
  }
};

const getEmptyStateTitle = (filter: string) => {
  switch (filter) {
    case "approved":
      return "Aucune annonce active";
    case "pending":
      return "Aucune annonce en attente";
    case "rejected":
      clear;

      return "Aucune annonce rejetée";
    default:
      return "Aucune annonce";
  }
};

const getEmptyStateDescription = (filter: string) => {
  switch (filter) {
    case "approved":
      return "Vous n'avez pas d'annonce approuvée actuellement.";
    case "pending":
      return "Aucune annonce n'est en attente de validation.";
    case "rejected":
      return "Aucune de vos annonces n'a été rejetée.";
    default:
      return "Commencez dès maintenant à vendre vos véhicules ou pièces détachées.";
  }
};

export default Dashboard;
