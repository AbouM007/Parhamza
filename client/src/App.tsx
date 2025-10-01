import React, { useState, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { Router, Route, Switch, useLocation } from "wouter";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { VehicleListings } from "@/components/VehicleListings";
import { VehicleDetail } from "@/components/VehicleDetail";
import { UnifiedAuthModal } from "@/components/UnifiedAuthModal";
import StripeSuccess from "./pages/StripeSuccess";
import { Dashboard } from "@/components/dashboard";
import { CreateListingForm } from "@/components/CreateListingForm";
import { DraggableModal } from "@/components/DraggableModal";
import { Conseils } from "@/components/Conseils";
import { SearchResults } from "@/components/SearchResults";
import { Footer } from "@/components/Footer";
import { AboutPage } from "./pages/AboutPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { LegalPage } from "./pages/LegalPage";
import { HelpPage } from "./pages/HelpPage";
import { SafetyTipsPage } from "./pages/SafetyTipsPage";
import { AdminDashboardClean } from "@/components/AdminDashboardClean";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminTest } from "@/components/AdminTest";
import { Messages } from "./pages/Messages";
import { SearchPage } from "./pages/SearchPage";
import ProShop from "./pages/ProShop";
import SubscriptionPurchase from "./pages/SubscriptionPurchase";
import { AuthCallback } from "./pages/AuthCallback";
import { ProfessionalVerification } from "./pages/ProfessionalVerification";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import { useAuth } from "@/contexts/AuthContext";
import StripeSuccessBoost from "@/pages/StripeSuccessBoost";
import { useCreateListingGuard } from "@/hooks/useCreateListingGuard";
import { OnboardingEntry } from "@/features/onboarding/OnboardingEntry";


function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshVehicles, setRefreshVehicles] = useState(false);

  // Hook pour gérer la création d'annonce avec vérification quota
  const handleCreateListingGuard = useCreateListingGuard();

  const { selectedVehicle, setSelectedVehicle, setSearchFilters } = useApp();
  const { user, profile, loading } = useAuth();
  const isAuthenticated = !!user;
  const isLoading = loading;
  // Note: refreshDbUser n'a pas d'équivalent direct dans AuthContext

  const [location, setLocation] = useLocation();

  const getCurrentView = useCallback(() => {
    if (location === "/") return "home";
    if (location.startsWith("/pro/")) return "pro-shop";
    return location.slice(1);
  }, [location]);

  const setCurrentView = useCallback(
    (view: string) => {
      setLocation(view === "home" ? "/" : `/${view}`);
    },
    [setLocation],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setLocation("/search");
    },
    [setLocation],
  );


  // Auto-sélection véhicule via URL (admin)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get("vehicle");
    if (vehicleId && !selectedVehicle) {
      fetch("/api/vehicles")
        .then((res) => res.json())
        .then((vehicles) => {
          const vehicle = vehicles.find((v: any) => v.id === vehicleId);
          if (vehicle) setSelectedVehicle(vehicle);
        })
        .catch((err) => console.error("❌ Erreur auto-sélection:", err));
    }
  }, [location, selectedVehicle, setSelectedVehicle]);

  // Modal création annonce
  React.useEffect(() => {
    if (location === "/create-listing") {
      setShowCreateListingModal(true);
      setLocation("/");
    }
  }, [location, setLocation]);

  React.useEffect(() => {
    if (!selectedVehicle) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location, selectedVehicle]);

  const handleBack = useCallback(() => {
    setSelectedVehicle(null);
  }, [setSelectedVehicle]);

  const handleBreadcrumbNavigation = useCallback(
    (path: string) => {
      setSelectedVehicle(null);
      if (path === "home") {
        setLocation("/");
      } else if (path.includes("/")) {
        const [category, brand] = path.split("/");
        setSearchFilters({ category, brand });
        setLocation("/listings");
      } else {
        const categoryMap: { [key: string]: string } = {
          "car-utility": "car",
          "moto-quad": "motorcycle",
          "nautisme-sport": "boat",
          services: "services",
          "spare-parts": "parts",
          motorcycle: "motorcycle",
          scooter: "scooter",
          quad: "quad",
          boat: "boat",
          jetski: "jetski",
          aircraft: "aircraft",
        };
        const filterCategory = categoryMap[path];
        if (filterCategory) {
          setSearchFilters({ category: filterCategory });
          setLocation("/listings");
        } else {
          setLocation("/");
        }
      }
    },
    [setSelectedVehicle, setLocation, setSearchFilters],
  );

  /* const handleCreateListing = useCallback(() => {
    setShowCreateListingModal(true);
  }, []);
*/

  const isAdminRoute = location.startsWith("/admin");
  const isOnboardingActive = profile && !profile.profileCompleted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {isOnboardingActive ? (
        <div className="min-h-screen bg-gray-50" />
      ) : (
        <>
          {!isAdminRoute && (
            <Header
              currentView={getCurrentView()}
              setCurrentView={setCurrentView}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              setDashboardTab={setDashboardTab}
              onSearch={handleSearch}
            />
          )}

          {selectedVehicle ? (
            <VehicleDetail
              vehicle={selectedVehicle}
              onBack={handleBack}
              onVehicleSelect={setSelectedVehicle}
              onNavigate={handleBreadcrumbNavigation}
              setCurrentView={setCurrentView}
            />
          ) : (
            <>
              <Switch>
                <Route path="/pro/:shopId">{() => <ProShop />}</Route>
                <Route path="/professional/:id">
                  <ProfessionalProfile />
                </Route>
                <Route path="/listings">
                  <VehicleListings />
                </Route>
                <Route path="/dashboard">
                  <Dashboard
                    initialTab={dashboardTab}
                    onCreateListing={() =>
                      handleCreateListingGuard(
                        () => setShowCreateListingModal(true),
                        "dashboard-button",
                      )
                    }
                    onRedirectHome={() => setLocation("/")}
                    onRedirectToSearch={() => setLocation("/search")}
                    setSearchFilters={setSearchFilters}
                    setCurrentView={setCurrentView}
                    refreshVehicles={refreshVehicles}
                  />
                </Route>
                <Route path="/create-listing">
                  <Hero setCurrentView={setCurrentView} />
                </Route>
                <Route path="/conseils">
                  <Conseils />
                </Route>
                <Route path="/about">
                  <AboutPage
                    onBack={() => setLocation("/")}
                    setCurrentView={setCurrentView}
                  />
                </Route>
                <Route path="/terms">
                  <TermsPage
                    onBack={() => setLocation("/")}
                    setCurrentView={setCurrentView}
                  />
                </Route>
                <Route path="/privacy">
                  <PrivacyPage
                    onBack={() => setLocation("/")}
                    setCurrentView={setCurrentView}
                  />
                </Route>
                <Route path="/legal">
                  <LegalPage
                    onBack={() => setLocation("/")}
                    setCurrentView={setCurrentView}
                  />
                </Route>
                <Route path="/help">
                  <HelpPage
                    onBack={() => setLocation("/")}
                    setCurrentView={setCurrentView}
                  />
                </Route>
                <Route path="/safety">
                  <SafetyTipsPage
                    onBack={() => setLocation("/")}
                    setCurrentView={setCurrentView}
                  />
                </Route>
                <Route path="/search">
                  <SearchPage />
                </Route>
                <Route path="/search-old">
                  <SearchResults
                    searchQuery={searchQuery}
                    onBack={() => setLocation("/")}
                    onVehicleSelect={setSelectedVehicle}
                  />
                </Route>
                <Route path="/messages">
                  <Messages />
                </Route>
                <Route path="/professional-verification">
                  <ProfessionalVerification />
                </Route>
                <Route path="/admin">
                  {() => {
                    const isAdminAuth =
                      localStorage.getItem("admin_authenticated") === "true";
                    return isAdminAuth ? (
                      <AdminDashboardClean onBack={() => setLocation("/")} />
                    ) : (
                      <AdminLogin
                        onLoginSuccess={() => setLocation("/admin")}
                        onBack={() => setLocation("/")}
                      />
                    );
                  }}
                </Route>
                <Route path="/success">
                  <StripeSuccess />
                </Route>
                <Route path="/success-boost">
                  <StripeSuccessBoost />
                </Route>
                <Route path="/admin-login">
                  <AdminLogin
                    onLoginSuccess={() => setLocation("/admin")}
                    onBack={() => setLocation("/")}
                  />
                </Route>
                <Route path="/admin-test">
                  <AdminTest />
                </Route>
                <Route path="/create-pro-account">
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold">Compte Professionnel</h2>
                    <p className="mt-4">Page en développement...</p>
                  </div>
                </Route>
                <Route path="/auth/callback">
                  <AuthCallback />
                </Route>
                <Route path="/subscription-purchase">
                  <SubscriptionPurchase onBack={() => setLocation("/dashboard")} />
                </Route>
                <Route path="/">
                  <Hero setCurrentView={setCurrentView} />
                </Route>
              </Switch>
              {!isAdminRoute && <Footer setCurrentView={setCurrentView} />}
            </>
          )}
        </>
      )}

      <UnifiedAuthModal />
      
      {/* ✅ Système d'onboarding V2 */}
      <OnboardingEntry 
        user={profile} 
        isEnabled={true}
      />

      {/* Modal création annonce */}
      <DraggableModal
        isOpen={showCreateListingModal}
        onClose={() => setShowCreateListingModal(false)}
        title="Déposer une annonce"
      >
        <CreateListingForm
          onSuccess={() => {
            setShowCreateListingModal(false);
            setLocation("/dashboard");
            setDashboardTab("listings");
            setRefreshVehicles((prev) => !prev);
          }}
        />
      </DraggableModal>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Route component={AppContent} />
          </Router>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
