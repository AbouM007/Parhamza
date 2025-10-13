import React, { useState } from "react";
import {
  Search,
  Bell,
  Heart,
  MessageCircle,
  User,
  Menu,
  X,
  LogIn,
  LogOut,
  Settings,
  Car,
  Plus,
  ChevronRight,
  ChevronDown,
  Home,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useCreateListingGuard } from "@/hooks/useCreateListingGuard";
import { UserMenu } from "./auth/UserMenu";
import { NotificationCenter } from "./NotificationCenter";
import logoPath from "@/assets/logo-transparent_1753108744744.png";
//import accidentIcon from "@/assets/accident_1753354197012.png";

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setDashboardTab?: (tab: string) => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  mobileMenuOpen,
  setMobileMenuOpen,
  setDashboardTab,
  onSearch,
}) => {
  const { setSearchFilters, setSelectedVehicle, openAuthModal } =
    useApp();
  const { user, profile, loading, signOut } = useAuth();
  const isAuthenticated = !!user;
  const isLoading = loading;
  const { unreadCount } = useUnreadMessages();
  const handleCreateListingWithQuota = useCreateListingGuard();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("vehicles");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // États pour les accordéons du menu mobile
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null);
  // Removed useAuthService - using openAuthModal from useApp() instead

  const handleAuthClick = (mode: "signin" | "signup") => {
    const authMode = mode === "signin" ? "login" : "register";
    openAuthModal(authMode as "login" | "register");
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view: string) => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    setCurrentView(view);
    setMobileMenuOpen(false);
    setOpenDropdown(null); // Fermer le dropdown après clic
  };

  // TEST ADMIN - Bouton temporaire pour accéder au dashboard admin
  const testAdminClick = () => {
    setCurrentView("admin-test");
    setMobileMenuOpen(false);
  };

  const handleDashboardNavClick = (tab: string) => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    if (setDashboardTab) {
      setDashboardTab(tab);
    }
    setCurrentView("dashboard");
    setMobileMenuOpen(false);
  };

  const handleCreateListingClick = async () => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    setMobileMenuOpen(false);

    // Utiliser le nouveau hook adapté avec API call direct
    handleCreateListingWithQuota(() => {
      setCurrentView("create-listing");
    }, "header-button");
  };

  // Fonction wrapper pour UserMenu
  const handleUserMenuCreateListing = () => {
    handleCreateListingWithQuota(() => {
      setCurrentView("create-listing");
    }, "user-menu");
  };

  const handleNavigate = (path: string) => {
    setActiveCategory("");
    setSelectedVehicle(null);
    setCurrentView(path.replace("/", ""));
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleSearch = () => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    if (searchTerm.trim()) {
      setSearchFilters({ searchTerm: searchTerm.trim() });
      setCurrentView("search");
      setSearchTerm("");
      setMobileMenuOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Structure des catégories et sous-catégories
  const categoryStructure = {
    "voiture-utilitaire": {
      label: "Voitures - Utilitaires",
      subcategories: [
        { id: "voiture", label: "Voitures" },
        { id: "utilitaire", label: "Utilitaires" },
        { id: "caravane", label: "Caravanes" },
        { id: "remorque", label: "Remorques" },
      ],
    },
    "moto-scooter-quad": {
      label: "Motos, Scooters, Quads",
      subcategories: [
        { id: "moto", label: "Motos" },
        { id: "scooter", label: "Scooters" },
        { id: "quad", label: "Quads" },
      ],
    },
    "nautisme-sport-aerien": {
      label: "Nautisme, Sport et Plein air",
      subcategories: [
        { id: "bateau", label: "Bateaux" },
        { id: "jetski", label: "Jet-skis" },
        { id: "aerien", label: "Aérien" },
      ],
    },
    services: {
      label: "Services",
      subcategories: [
        { id: "reparation", label: "Réparation" },
        { id: "remorquage", label: "Remorquage" },
        { id: "entretien", label: "Entretien" },
        { id: "autre-service", label: "Autres services" },
      ],
    },
    pieces: {
      label: "Pièces détachées",
      subcategories: [
        { id: "piece-voiture", label: "Pièces voiture" },
        { id: "piece-moto", label: "Pièces moto" },
        { id: "autre-piece", label: "Autres pièces" },
      ],
    },
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    setSearchFilters({ category: subcategoryId });
    setCurrentView("listings");
    setMobileMenuOpen(false);
    setOpenDropdown(null); // Fermer le dropdown après clic
  };

  const handleDamagedVehiclesClick = () => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    setSearchFilters({
      condition: "damaged",
      viewMode: "categorized",
    });
    setCurrentView("listings");
    setMobileMenuOpen(false);
    setOpenDropdown(null); // Fermer le dropdown après clic
  };

  const handleSparePartsClick = () => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    setSearchFilters({
      viewMode: "categorized-parts",
    });
    setCurrentView("listings");
    setMobileMenuOpen(false);
    setOpenDropdown(null); // Fermer le dropdown après clic
  };

  const handleServicesClick = () => {
    setActiveCategory(""); // Désactiver le soulignement des catégories principales
    setSelectedVehicle(null); // Fermer le détail du véhicule si ouvert
    setSearchFilters({
      viewMode: "categorized-services",
    });
    setCurrentView("listings");
    setMobileMenuOpen(false);
    setOpenDropdown(null); // Fermer le dropdown après clic
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setMobileMenuOpen(false);

    // Pour les catégories principales, on va vers la première sous-catégorie
    const categoryData =
      categoryStructure[category as keyof typeof categoryStructure];
    if (categoryData && categoryData.subcategories.length > 0) {
      handleSubcategoryClick(categoryData.subcategories[0].id);
    }
  };

  const categories = [
    { id: "voiture-utilitaire", label: "Voitures - Utilitaires" },
    { id: "moto-scooter-quad", label: "Motos, Scooters, Quads" },
    { id: "nautisme-sport-aerien", label: "Nautisme, Sport et Plein air" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile: Menu burger (left) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-primary-bolt-500 hover:bg-gray-50 transition-all duration-200 order-1"
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo (center on mobile, left on desktop) */}
          <div
            className="flex items-center cursor-pointer relative z-[105] order-2 lg:order-none mx-auto lg:mx-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavClick("home");
            }}
          >
            <img
              src={logoPath}
              alt="Passion Auto2Roues"
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 flex-1 max-w-4xl mx-8 lg:order-none">
            {/* Deposit Button */}
            <button
              onClick={() =>
                handleCreateListingWithQuota(() =>
                  setCurrentView("create-listing"),
                )
              }
              className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Déposer une annonce
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher sur PassionAuto2Roues.com ... "
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all text-gray-900 placeholder-gray-500"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-primary-bolt-500 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Icons */}
          <div className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                {/* Mes annonces */}
                <button
                  onClick={() => handleDashboardNavClick("listings")}
                  className="flex flex-col items-center text-gray-600 hover:text-primary-bolt-500 transition-colors group"
                >
                  <Car className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">Mes annonces</span>
                </button>

                {/* Favoris */}
                <button
                  onClick={() => handleDashboardNavClick("favorites")}
                  className="flex flex-col items-center text-gray-600 hover:text-primary-bolt-500 transition-colors group"
                >
                  <Heart className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">Favoris</span>
                </button>

                {/* Messages */}
                <button
                  onClick={() => handleDashboardNavClick("messages")}
                  className="flex flex-col items-center text-gray-600 hover:text-primary-bolt-500 transition-colors group relative"
                >
                  <MessageCircle className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <div className="flex flex-col items-center">
                  <NotificationCenter />
                  <span className="text-xs text-gray-600 mt-1">Notifications</span>
                </div>

                {/* User Menu */}
                <UserMenu
                  onNavigate={handleNavigate}
                  onDashboardNavigate={handleDashboardNavClick}
                  onCreateListingWithQuota={handleUserMenuCreateListing}
                />
              </div>
            ) : (
              <button
                onClick={() => handleAuthClick("signin")}
                className="flex flex-col items-center text-gray-600 hover:text-primary-bolt-500 transition-colors group"
              >
                <User className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs">Se connecter</span>
              </button>
            )}
          </div>

          {/* Mobile: User icon (right) */}
          <button
            onClick={() => isAuthenticated ? handleDashboardNavClick("profile") : handleAuthClick("signin")}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-primary-bolt-500 hover:bg-gray-50 transition-all duration-200 order-3"
            data-testid="mobile-user-button"
          >
            <User className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar & Create Button */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all text-gray-900 placeholder-gray-500"
            data-testid="mobile-search-input"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-primary-bolt-500 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Create Listing Button */}
        <button
          onClick={handleCreateListingClick}
          className="w-full bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          data-testid="mobile-create-listing-button"
        >
          <Plus className="h-5 w-5" />
          <span>Déposer une annonce</span>
        </button>
      </div>

      {/* Categories Menu */}
      <div className="hidden lg:block border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8 py-3">
            {categories.map((category, index) => (
              <div key={category.id} className="flex items-center">
                {/* Catégories principales avec dropdown */}
                <div className="relative">
                  <div
                    className={`text-sm transition-all duration-200 relative py-2 cursor-pointer ${
                      activeCategory === category.id
                        ? "text-primary-bolt-500"
                        : "text-gray-700 hover:text-primary-bolt-500"
                    }`}
                    onMouseEnter={() => setOpenDropdown(category.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    {category.label}
                    {activeCategory === category.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-bolt-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {categoryStructure[
                    category.id as keyof typeof categoryStructure
                  ] && (
                    <div
                      className={`absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-200 z-[110] ${
                        openDropdown === category.id
                          ? "opacity-100 visible"
                          : "opacity-0 invisible"
                      }`}
                      onMouseEnter={() => setOpenDropdown(category.id)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <div className="py-2">
                        {categoryStructure[
                          category.id as keyof typeof categoryStructure
                        ].subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubcategoryClick(subcategory.id);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 transition-colors"
                          >
                            {subcategory.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {index < categories.length - 1 && (
                  <span className="text-gray-300 text-sm ml-8">•</span>
                )}
              </div>
            ))}

            {/* Séparateur avant Services */}
            <span className="text-gray-300 text-sm">•</span>

            {/* Bouton Services */}
            <button
              onClick={handleServicesClick}
              className="text-gray-700 text-sm hover:text-primary-bolt-500 transition-all duration-200 py-2 cursor-pointer"
              data-testid="button-services"
            >
              Services
            </button>

            {/* Séparateur avant Pièces détachées */}
            <span className="text-gray-300 text-sm">•</span>

            {/* Bouton Pièces détachées */}
            <button
              onClick={handleSparePartsClick}
              className="text-gray-700 text-sm hover:text-primary-bolt-500 transition-all duration-200 py-2 cursor-pointer"
              data-testid="button-spare-parts"
            >
              Pièces détachées
            </button>

            {/* Séparateur avant Accidentés */}
            <span className="text-gray-300 text-sm">•</span>

            {/* Bouton Véhicules Accidentés */}
            <button
              onClick={handleDamagedVehiclesClick}
              className="text-gray-800 font-bold text-sm hover:text-gray-900 transition-colors duration-200"
              data-testid="button-damaged-vehicles"
            >
              Accidentés
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {/* Lien Accueil */}
            <button
              onClick={() => handleNavClick("home")}
              className="w-full flex items-center justify-between py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Home className="h-5 w-5" />
                <span className="font-medium">Accueil</span>
              </div>
            </button>

            {/* Accordéon principal : Toutes les catégories */}
            <div className="border-t border-gray-200 pt-2">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5" />
                  <span className="font-medium">Toutes les catégories</span>
                </div>
                {categoriesOpen ? (
                  <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-5 w-5 transition-transform duration-200" />
                )}
              </button>

              {/* Contenu de l'accordéon principal */}
              {categoriesOpen && (
                <div className="mt-2 ml-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Voitures - Utilitaires */}
                  <div>
                    <button
                      onClick={() => setOpenSubCategory(openSubCategory === "voiture-utilitaire" ? null : "voiture-utilitaire")}
                      className="w-full flex items-center justify-between py-2.5 px-4 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-xl transition-colors"
                    >
                      <span>🚗 Voitures - Utilitaires</span>
                      {openSubCategory === "voiture-utilitaire" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openSubCategory === "voiture-utilitaire" && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryStructure["voiture-utilitaire"]?.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="block w-full text-left py-2 px-4 text-sm text-gray-600 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-lg transition-colors"
                          >
                            {subcategory.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Motos, Scooters, Quads */}
                  <div>
                    <button
                      onClick={() => setOpenSubCategory(openSubCategory === "moto-scooter-quad" ? null : "moto-scooter-quad")}
                      className="w-full flex items-center justify-between py-2.5 px-4 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-xl transition-colors"
                    >
                      <span>🏍️ Motos, Scooters, Quads</span>
                      {openSubCategory === "moto-scooter-quad" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openSubCategory === "moto-scooter-quad" && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryStructure["moto-scooter-quad"]?.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="block w-full text-left py-2 px-4 text-sm text-gray-600 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-lg transition-colors"
                          >
                            {subcategory.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nautisme, Sport et Plein air */}
                  <div>
                    <button
                      onClick={() => setOpenSubCategory(openSubCategory === "nautisme-sport-aerien" ? null : "nautisme-sport-aerien")}
                      className="w-full flex items-center justify-between py-2.5 px-4 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-xl transition-colors"
                    >
                      <span>⛵ Nautisme, Sport et Plein air</span>
                      {openSubCategory === "nautisme-sport-aerien" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openSubCategory === "nautisme-sport-aerien" && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryStructure["nautisme-sport-aerien"]?.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="block w-full text-left py-2 px-4 text-sm text-gray-600 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-lg transition-colors"
                          >
                            {subcategory.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Accidentés (lien direct) */}
                  <button
                    onClick={handleDamagedVehiclesClick}
                    className="w-full flex items-center py-2.5 px-4 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-xl transition-colors"
                    data-testid="button-damaged-vehicles-mobile"
                  >
                    <span>💥 Accidentés</span>
                  </button>

                  {/* Pièces détachées */}
                  <div>
                    <button
                      onClick={() => setOpenSubCategory(openSubCategory === "pieces" ? null : "pieces")}
                      className="w-full flex items-center justify-between py-2.5 px-4 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-xl transition-colors"
                    >
                      <span>🔧 Pièces détachées</span>
                      {openSubCategory === "pieces" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openSubCategory === "pieces" && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryStructure.pieces?.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="block w-full text-left py-2 px-4 text-sm text-gray-600 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-lg transition-colors"
                          >
                            {subcategory.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  <div>
                    <button
                      onClick={() => setOpenSubCategory(openSubCategory === "services" ? null : "services")}
                      className="w-full flex items-center justify-between py-2.5 px-4 text-sm text-gray-700 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-xl transition-colors"
                    >
                      <span>🛠️ Services</span>
                      {openSubCategory === "services" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openSubCategory === "services" && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryStructure.services?.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="block w-full text-left py-2 px-4 text-sm text-gray-600 hover:bg-primary-bolt-50 hover:text-primary-bolt-600 rounded-lg transition-colors"
                          >
                            {subcategory.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section utilisateur */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              {isAuthenticated ? (
                <div className="space-y-2">
                  {/* Mes annonces */}
                  <button
                    onClick={() => handleDashboardNavClick("listings")}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Car className="h-5 w-5" />
                    <span>Mes annonces</span>
                  </button>

                  {/* Messages */}
                  <button
                    onClick={() => handleDashboardNavClick("messages")}
                    className="w-full flex items-center justify-between py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5" />
                      <span>Messages</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications */}
                  <button
                    onClick={() => handleNavigate("notifications")}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>

                  {/* Séparateur */}
                  <div className="border-t border-gray-200 pt-2"></div>

                  {/* Mon profil */}
                  <button
                    onClick={() => handleDashboardNavClick("profile")}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>Mon profil</span>
                  </button>

                  {/* Paramètres de notifications */}
                  <button
                    onClick={() => handleNavigate("/notification-settings")}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    data-testid="mobile-menu-notification-settings"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Paramètres de notifications</span>
                  </button>

                  {/* Se déconnecter */}
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                      setCurrentView("home");
                    }}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Se déconnecter</span>
                  </button>

                  {/* Aide */}
                  <button
                    onClick={() => handleNavigate("help")}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span className="text-lg">❓</span>
                    <span>Aide</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleAuthClick("signin")}
                    className="w-full text-left py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => handleAuthClick("signup")}
                    className="w-full text-left py-3 px-4 bg-primary-bolt-50 text-primary-bolt-500 hover:bg-primary-bolt-100 rounded-xl transition-colors"
                  >
                    S'inscrire
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal handled by AuthModal in App.tsx */}
      {/* Quota Modal handled centrally by AppContext */}
    </header>
  );
};
