import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Car, 
  Heart, 
  MessageCircle, 
  User, 
  Crown,
  ChevronRight
} from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useQuery } from "@tanstack/react-query";
import { MobilePageHeader } from "@/components/MobilePageHeader";

interface AccountSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  gradient: string;
  action: () => void;
  badge?: number;
}

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { profile } = useAuth();
  const { unreadCount } = useUnreadMessages();

  // Récupérer le nombre d'annonces
  const { data: userVehicles = [] } = useQuery<any[]>({
    queryKey: profile?.id ? [`/api/vehicles/user/${profile.id}`] : [],
    enabled: !!profile?.id,
  });

  // Récupérer le nombre de favoris
  const { data: favorites = [] } = useQuery<any[]>({
    queryKey: profile?.id ? [`/api/favorites/user/${profile.id}`] : [],
    enabled: !!profile?.id,
  });

  const sections: AccountSection[] = [
    {
      id: "dashboard",
      title: "Vue d'ensemble",
      icon: <LayoutDashboard className="h-8 w-8" />,
      gradient: "from-blue-500 to-cyan-500",
      action: () => setLocation("/dashboard"),
    },
    {
      id: "listings",
      title: "Mes annonces",
      icon: <Car className="h-8 w-8" />,
      gradient: "from-orange-500 to-red-500",
      action: () => setLocation("/dashboard?tab=listings"),
      badge: userVehicles.length,
    },
    {
      id: "favorites",
      title: "Mes Favoris",
      icon: <Heart className="h-8 w-8" />,
      gradient: "from-pink-500 to-rose-500",
      action: () => setLocation("/dashboard?tab=favorites"),
      badge: favorites.length,
    },
    {
      id: "messages",
      title: "Messages",
      icon: <MessageCircle className="h-8 w-8" />,
      gradient: "from-green-500 to-emerald-500",
      action: () => setLocation("/messages"),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: "profile",
      title: "Mon Profil",
      icon: <User className="h-8 w-8" />,
      gradient: "from-purple-500 to-indigo-500",
      action: () => setLocation("/dashboard?tab=profile"),
    },
    {
      id: "premium",
      title: "Premium",
      icon: <Crown className="h-8 w-8" />,
      gradient: "from-yellow-500 to-amber-500",
      action: () => setLocation("/subscription-settings"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobilePageHeader 
        title="Mon Compte" 
        onBack={() => setLocation("/")} 
      />
      
      {/* Grille de sections */}
      <div className="p-4">
        <h1 className="hidden lg:block text-2xl font-bold text-gray-900 mb-6" data-testid="title-account">
          Mon Compte
        </h1>

        <div className="grid grid-cols-2 gap-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={section.action}
              className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
              data-testid={`card-${section.id}`}
            >
              {/* Badge */}
              {section.badge !== undefined && section.badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                  {section.badge > 99 ? '99+' : section.badge}
                </div>
              )}

              {/* Icône avec gradient */}
              <div className={`bg-gradient-to-br ${section.gradient} text-white rounded-xl p-3 mb-4 inline-flex`}>
                {section.icon}
              </div>

              {/* Titre */}
              <h3 className="text-sm font-semibold text-gray-900 text-left mb-1">
                {section.title}
              </h3>

              {/* Flèche */}
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Info utilisateur (optionnel) */}
        {profile && (
          <div className="mt-8 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-bolt-400 to-primary-bolt-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {(profile.name?.[0] || profile.email?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {profile.name || profile.email}
                </p>
                <p className="text-sm text-gray-500">
                  {profile.type === 'professional' ? 'Compte Professionnel' : 'Compte Particulier'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
