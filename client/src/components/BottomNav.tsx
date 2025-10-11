import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { useCreateListingGuard } from "@/hooks/useCreateListingGuard";

interface BottomNavProps {
  setDashboardTab?: (tab: string) => void;
}

export function BottomNav({ setDashboardTab }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { openAuthModal } = useApp();
  const handleCreateListingWithQuota = useCreateListingGuard();

  const handleAccountClick = () => {
    if (user) {
      // Si connecté, aller à la page Mon Compte
      setLocation("/account");
    } else {
      // Si non connecté, ouvrir le modal de connexion
      openAuthModal("login");
    }
  };

  const handleMessagesClick = () => {
    // Rediriger vers la page messages standalone
    setLocation("/messages");
  };

  const handleCreateListing = () => {
    handleCreateListingWithQuota(() => {
      setLocation("/create-listing");
    }, "bottom-nav-button");
  };

  const navItems = [
    {
      icon: Home,
      label: "Accueil",
      path: "/",
      active: location === "/",
      onClick: () => setLocation("/"),
    },
    {
      icon: Search,
      label: "Recherche",
      path: "/search",
      active: location === "/search",
      onClick: () => setLocation("/search"),
    },
    {
      icon: PlusCircle,
      label: "Déposer",
      path: "/create-listing",
      active: location === "/create-listing",
      primary: true,
      onClick: handleCreateListing,
    },
    {
      icon: MessageCircle,
      label: "Messages",
      path: "/messages",
      active: location === "/messages" || location.startsWith("/messages/"),
      onClick: handleMessagesClick,
    },
    {
      icon: User,
      label: "Compte",
      path: user ? "/account" : "#",
      active: location === "/account",
      onClick: handleAccountClick,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                item.primary
                  ? "transform -translate-y-2"
                  : ""
              }`}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
            >
              <div
                className={`flex items-center justify-center ${
                  item.primary
                    ? "w-14 h-14 rounded-full bg-primary-bolt-500 text-white shadow-lg"
                    : "w-10 h-10"
                }`}
              >
                <Icon
                  className={`${
                    item.primary
                      ? "w-6 h-6"
                      : isActive
                      ? "w-6 h-6 text-primary-bolt-500"
                      : "w-6 h-6 text-gray-500"
                  }`}
                />
              </div>
              <span
                className={`text-xs mt-1 ${
                  item.primary
                    ? "text-primary-bolt-500 font-semibold"
                    : isActive
                    ? "text-primary-bolt-500 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
