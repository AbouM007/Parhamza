import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, Vehicle, Message, SearchFilters } from "@/types";
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

  // Quota
  handleCreateListingWithQuota: (onSuccess: () => void) => Promise<void>;
  refreshQuota: () => Promise<void>;

  // Auth
  openAuthModal: (mode: "login" | "register", onComplete?: () => void) => void;
  runAuthCallbackAfterLogin: () => void; // à appeler APRES login réussi

  // QuotaModal
  isQuotaModalOpen: boolean;
  quotaModalInfo: any;
  closeQuotaModal: () => void;
  setIsQuotaModalOpen: (open: boolean) => void;
  setQuotaModalInfo: (info: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
};

interface AppProviderProps {
  children: ReactNode;
}

// ------- API utils
const fetchVehicles = async (): Promise<Vehicle[]> => {
  const res = await fetch(`/api/vehicles?t=${Date.now()}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const fetchUserByEmail = async (email: string): Promise<User | null> => {
  const res = await fetch(`/api/users/by-email/${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  return res.json();
};

const fetchQuota = async (userId: string) => {
  const res = await fetch(`/api/users/${userId}/quota/check`);
  return res.ok ? res.json() : null;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  // Quota (en mémoire)
  const [userQuota, setUserQuota] = useState<any>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaModalInfo, setQuotaModalInfo] = useState<any>(null);

  // ------- Init app (chargements parallèles)
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem("currentUser");
        if (!saved) {
          // Pas d’utilisateur → on charge au moins les véhicules
          const v = await fetchVehicles();
          setVehicles(v);
          return;
        }
        const savedUser = JSON.parse(saved);

        const [user, v, q] = await Promise.all([
          fetchUserByEmail(savedUser.email),
          fetchVehicles(),
          fetchQuota(savedUser.id),
        ]);

        if (user) {
          setCurrentUser(user);
          localStorage.setItem("currentUser", JSON.stringify(user));
        } else {
          localStorage.removeItem("currentUser");
        }

        setVehicles(v);
        setUserQuota(q);
      } catch (e) {
        console.error("init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Sync localStorage si currentUser change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // ------- Actions
  const refreshVehicles = async () => {
    setIsLoading(true);
    try {
      setVehicles(await fetchVehicles());
    } finally {
      setIsLoading(false);
    }
  };

  const refreshQuota = async () => {
    if (!currentUser) {
      setUserQuota(null);
      return;
    }
    try {
      const q = await fetchQuota(currentUser.id);
      setUserQuota(q);
    } catch (e) {
      console.error("refreshQuota error:", e);
    }
  };

  const closeQuotaModal = () => {
    setIsQuotaModalOpen(false);
    setQuotaModalInfo(null);
  };

  // n’ouvre plus le modal login “pour rien” : on stocke la callback
  const openAuthModal = (mode: "login" | "register", onComplete?: () => void) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    if (onComplete) setAuthCallback(() => onComplete);
  };

  // à appeler APRES login réussi (dans ton Auth UI)
  const runAuthCallbackAfterLogin = () => {
    if (authCallback) {
      try {
        authCallback();
      } finally {
        setAuthCallback(null);
        setShowAuthModal(false);
      }
    } else {
      setShowAuthModal(false);
    }
  };

  // protège contre le faux “non connecté” tant que isLoading est true
  const handleCreateListingWithQuota = async (onSuccess: () => void) => {
    if (isLoading) {
      // l’état auth n’est pas encore fiable → ne rien faire
      return;
    }

    if (!currentUser) {
      openAuthModal("login", onSuccess);
      return;
    }

    if (!userQuota) {
      // quota pas encore chargé → on laisse passer et on rafraîchit après
      onSuccess();
      await refreshQuota();
      return;
    }

    if (userQuota.canCreate) {
      onSuccess();
      await refreshQuota(); // après création, mets à jour le quota
    } else {
      setQuotaModalInfo(userQuota);
      setIsQuotaModalOpen(true);
    }
  };

  // ------- Filtrage (version complète)
  const filteredVehicles = vehicles
    .filter((vehicle) => {
      if (searchFilters.category) {
        const categoryMap: Record<string, string[]> = {
          "voiture-utilitaire": ["voiture", "utilitaire", "caravane", "remorque"],
          "moto-scooter-quad": ["moto", "scooter", "quad"],
          "nautisme-sport-aerien": ["bateau", "jetski", "aerien"],
          services: ["reparation", "remorquage", "entretien", "autre-service"],
          pieces: ["piece-voiture", "piece-moto", "autre-piece"],
        };
        if (categoryMap[searchFilters.category]) {
          if (!categoryMap[searchFilters.category].includes(vehicle.category)) return false;
        } else if (vehicle.category !== searchFilters.category) return false;
      }

      if (searchFilters.subcategory && vehicle.category !== searchFilters.subcategory) return false;
      if (searchFilters.brand && vehicle.brand !== searchFilters.brand) return false;
      if (searchFilters.model && !vehicle.model.toLowerCase().includes(searchFilters.model.toLowerCase())) return false;
      if (searchFilters.yearFrom && vehicle.year < searchFilters.yearFrom) return false;
      if (searchFilters.yearTo && vehicle.year > searchFilters.yearTo) return false;
      if (searchFilters.mileageFrom && vehicle.mileage && vehicle.mileage < searchFilters.mileageFrom) return false;
      if (searchFilters.mileageTo && vehicle.mileage && vehicle.mileage > searchFilters.mileageTo) return false;
      if (searchFilters.priceFrom && vehicle.price < searchFilters.priceFrom) return false;
      if (searchFilters.priceTo && vehicle.price > searchFilters.priceTo) return false;
      if (searchFilters.fuelType && vehicle.fuelType !== searchFilters.fuelType) return false;
      if (searchFilters.condition && vehicle.condition !== searchFilters.condition) return false;
      if (searchFilters.location && !vehicle.location.toLowerCase().includes(searchFilters.location.toLowerCase())) return false;
      if (searchFilters.searchTerm && !vehicle.title.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())) return false;

      return true;
    })
    .sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      switch (searchFilters.sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "mileage":
          return (a.mileage || 0) - (b.mileage || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
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
        refreshVehicles,
        handleCreateListingWithQuota,
        refreshQuota,
        openAuthModal,
        runAuthCallbackAfterLogin,
        isQuotaModalOpen,
        quotaModalInfo,
        closeQuotaModal,
        setIsQuotaModalOpen,
        setQuotaModalInfo,
      }}
    >
      {children}

      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={closeQuotaModal}
        quotaInfo={quotaModalInfo || { used: 0, maxListings: 5 }}
      />
    </AppContext.Provider>
  );
};
