import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Vehicle } from "@/types";

interface FavoritesContextType {
  favorites: Vehicle[];
  favoriteIds: Set<string>;
  loading: boolean;
  addToFavorites: (vehicleId: string) => Promise<boolean>;
  removeFromFavorites: (vehicleId: string) => Promise<boolean>;
  toggleFavorite: (vehicleId: string) => Promise<boolean>;
  isFavorite: (vehicleId: string) => boolean;
  refreshFavorites: (forceReload?: boolean) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Vehicle[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const lastLoadTimeRef = useRef<number>(0);
  const { profile } = useAuth();

  const loadFavorites = async (forceReload = false) => {
    if (!profile?.id) return;

    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

    if (!forceReload && now - lastLoadTimeRef.current < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/favorites/user/${profile.id}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        setFavoriteIds(new Set(data.map((fav: Vehicle) => fav.id)));
        lastLoadTimeRef.current = now;
        //console.log("✅ Favoris rechargés:", data.length);
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (vehicleId: string) => {
    if (!profile?.id) {
      alert("Veuillez vous connecter pour ajouter un favori");
      return false;
    }

    setFavoriteIds((prev) => new Set([...prev, vehicleId]));

    try {
      const response = await fetch("/api/favorites/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, vehicleId }),
      });

      if (response.ok) {
        //console.log("✅ Favori ajouté avec succès");
        await loadFavorites(true);
        return true;
      } else {
        const result = await response.json();
        console.error("❌ Erreur API ajout favori:", result);
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(vehicleId);
          return newSet;
        });
      }
    } catch (error) {
      console.error("❌ Erreur réseau ajout favori:", error);
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });
    }
    return false;
  };

  const removeFromFavorites = async (vehicleId: string) => {
    if (!profile?.id) {
      alert("Veuillez vous connecter pour supprimer un favori");
      return false;
    }

    const previousIds = new Set(favoriteIds);
    const previousFavorites = [...favorites];

    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(vehicleId);
      return newSet;
    });
    setFavorites((prev) => prev.filter((fav) => fav.id !== vehicleId));

    try {
      const response = await fetch("/api/favorites/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, vehicleId }),
      });

      if (response.ok) {
        //console.log("✅ Favori supprimé avec succès");
        return true;
      } else {
        const result = await response.json();
        console.error("❌ Erreur API suppression favori:", result);
        setFavoriteIds(previousIds);
        setFavorites(previousFavorites);
      }
    } catch (error) {
      console.error("❌ Erreur réseau suppression favori:", error);
      setFavoriteIds(previousIds);
      setFavorites(previousFavorites);
    }
    return false;
  };

  const toggleFavorite = async (vehicleId: string) => {
    if (favoriteIds.has(vehicleId)) {
      return await removeFromFavorites(vehicleId);
    } else {
      return await addToFavorites(vehicleId);
    }
  };

  const isFavorite = (vehicleId: string) => favoriteIds.has(vehicleId);

  useEffect(() => {
    if (profile?.id) {
      const timer = setTimeout(() => {
        loadFavorites();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setFavorites([]);
      setFavoriteIds(new Set());
    }
  }, [profile?.id]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        loading,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error(
      "useFavoritesContext must be used within a FavoritesProvider",
    );
  }
  return context;
}
