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

// --- Utils
const fetchVehicles = async (): Promise<Vehicle[]> => {
  const response = await fetch(`/api/vehicles?t=${Date.now()}`, {
    cache: "no-cache",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
};

const fetchUserByEmail = async (email: string): Promise<User | null> => {
  const response = await fetch(
    `/api/users/by-email/${encodeURIComponent(email)}`,
  );
  if (!response.ok) return null;
  return await response.json();
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

  // 🔥 Quota
  const [userQuota, setUserQuota] = useState<any>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaModalInfo, setQuotaModalInfo] = useState<any>(null);

  // --- Charger tout en parallèle au démarrage
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const savedUser = localStorage.getItem("currentUser");
        if (!savedUser) {
          setVehicles(await fetchVehicles()); // Même sans user on charge les véhicules
          return;
        }

        const userData = JSON.parse(savedUser);

        // 🚀 Tout charger en parallèle
        const [user, vehiclesData, quotaData] = await Promise.all([
          fetchUserByEmail(userData.email),
          fetchVehicles(),
          fetch(`/api/users/${userData.id}/quota/check`).then((res) =>
            res.ok ? res.json() : null,
          ),
        ]);

        if (user) {
          setCurrentUser(user);
          localStorage.setItem("currentUser", JSON.stringify(user));
        } else {
          localStorage.removeItem("currentUser");
        }

        setVehicles(vehiclesData);
        setUserQuota(quotaData);
      } catch (e) {
        console.error("❌ Erreur initApp:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Sauvegarde user si modifié
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // --- Refresh vehicles manuel
  const refreshVehicles = async () => {
    setIsLoading(true);
    try {
      setVehicles(await fetchVehicles());
    } finally {
      setIsLoading(false);
    }
  };

  // --- Refresh quota manuel
  const refreshQuota = async () => {
    if (!currentUser) {
      setUserQuota(null);
      return;
    }
    try {
      const res = await fetch(`/api/users/${currentUser.id}/quota/check`);
      if (res.ok) {
        setUserQuota(await res.json());
      }
    } catch (e) {
      console.error("Erreur refresh quota:", e);
    }
  };

  // --- Gestion quota
  const closeQuotaModal = () => {
    setIsQuotaModalOpen(false);
    setQuotaModalInfo(null);
  };

  const openAuthModal = (
    mode: "login" | "register",
    onComplete?: () => void,
  ) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    if (onComplete) onComplete();
  };

  const handleCreateListingWithQuota = async (onSuccess: () => void) => {
    if (!currentUser) {
      openAuthModal("login", onSuccess);
      return;
    }

    if (!userQuota) {
      console.warn("⚠️ Quota non encore chargé → laisser passer");
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

  // --- Filtrage véhicules
  const filteredVehicles = vehicles; // (je laisse ton filtrage custom si besoin)

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
        refreshVehicles,
        handleCreateListingWithQuota,
        refreshQuota,
        openAuthModal,
        isQuotaModalOpen,
        quotaModalInfo,
        closeQuotaModal,
      }}
    >
      {children}

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
