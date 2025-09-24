import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, Vehicle, Message, SearchFilters } from "@/types";
import { log } from "@/lib/logger";
import { QuotaModal } from "@/components/QuotaModal";

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  filteredVehicles: Vehicle[];
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  refreshVehicles: () => Promise<void>;

  // 🔥 Gestion du quota
  handleCreateListingWithQuota: (onSuccess: () => void) => Promise<void>;
  refreshQuota: () => Promise<void>;

  // Auth
  openAuthModal: (mode: "login" | "register", onComplete?: () => void) => void;

  // QuotaModal centralisé
  isQuotaModalOpen: boolean;
  quotaModalInfo: any;
  closeQuotaModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Fonction utilitaire pour charger les véhicules
const fetchVehicles = async (): Promise<Vehicle[]> => {
  try {
    const response = await fetch(`/api/vehicles?t=${Date.now()}`, {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("❌ Impossible de charger depuis Supabase:", error);
    const { mockVehicles } = await import("@/utils/mockData");
    return mockVehicles;
  }
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // 🔥 Nouveaux états pour quota
  const [userQuota, setUserQuota] = useState<any>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaModalInfo, setQuotaModalInfo] = useState<any>(null);
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  // Charger l’utilisateur au démarrage
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          const response = await fetch(
            `/api/users/by-email/${encodeURIComponent(userData.email)}`,
          );
          if (response.ok) {
            const user = await response.json();
            setCurrentUser(user);
            log("User connected:", user.email);
          } else {
            localStorage.removeItem("currentUser");
          }
        }
      } catch (error) {
        console.error("❌ Error loading user:", error);
        localStorage.removeItem("currentUser");
      }
    };

    loadCurrentUser();
  }, []);

  // Sauvegarder user dans localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // Charger véhicules
  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      setVehicles(await fetchVehicles());
      setIsLoading(false);
    };
    loadVehicles();
  }, []);

  // 🔥 Charger quota quand l’utilisateur change
  useEffect(() => {
    refreshQuota();
  }, [currentUser]);

  // Fonction pour rafraîchir le quota
  const refreshQuota = async () => {
    if (!currentUser) {
      setUserQuota(null);
      return;
    }
    try {
      const res = await fetch(`/api/users/${currentUser.id}/quota/check`);
      if (res.ok) {
        const data = await res.json();
        setUserQuota(data);
      }
    } catch (e) {
      console.error("Erreur refresh quota:", e);
    }
  };

  // Fermer QuotaModal
  const closeQuotaModal = () => {
    setIsQuotaModalOpen(false);
    setQuotaModalInfo(null);
  };

  // Ouvrir AuthModal
  const openAuthModal = (
    mode: "login" | "register",
    onComplete?: () => void,
  ) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setAuthCallback(() => onComplete);
  };

  // Vérifier quota avant création
  const handleCreateListingWithQuota = async (onSuccess: () => void) => {
    if (!currentUser) {
      openAuthModal("login", onSuccess);
      return;
    }

    if (!userQuota) {
      console.warn("⚠️ Quota pas encore chargé → on laisse passer");
      onSuccess();
      return;
    }

    if (userQuota.canCreate) {
      onSuccess();
    } else {
      setQuotaModalInfo(userQuota);
      setIsQuotaModalOpen(true);
    }
  };

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (searchFilters.category && vehicle.category !== searchFilters.category)
      return false;
    if (searchFilters.brand && vehicle.brand !== searchFilters.brand)
      return false;
    if (
      searchFilters.searchTerm &&
      !vehicle.title
        .toLowerCase()
        .includes(searchFilters.searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        vehicles,
        setVehicles,
        selectedVehicle,
        setSelectedVehicle,
        searchFilters,
        setSearchFilters,
        filteredVehicles,
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        refreshVehicles: async () => setVehicles(await fetchVehicles()),
        // 🔥 Quota
        handleCreateListingWithQuota,
        refreshQuota,
        openAuthModal,
        isQuotaModalOpen,
        quotaModalInfo,
        closeQuotaModal,
      }}
    >
      {children}

      {/* Modal centralisé */}
      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={closeQuotaModal}
        quotaInfo={quotaModalInfo || { used: 0, maxListings: 5 }}
        onUpgrade={() => {
          closeQuotaModal();
          window.location.href = "/subscription-plans";
        }}
      />
    </AppContext.Provider>
  );
};
