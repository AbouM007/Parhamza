import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Settings,
  BarChart3,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Building2,
  Download,
  Check,
  X,
  ExternalLink,
  CreditCard,
  Zap,
  Crown,
  Euro,
  Flag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReportsSection from './dashboard/ReportsSection';

interface AdminStats {
  totalUsers: number;
  totalAnnonces: number;
  // pendingReports supprimé
  recentActivity: number;
  monthlyGrowth: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  type: string;
  verified: boolean;
  emailVerified?: boolean;
  createdAt: string;
}

interface Annonce {
  id: string;
  title: string;
  user?: {
    name: string;
  };
  status: string;
  price: number;
  createdAt: string;
}

interface ProfessionalAccount {
  id: number;
  company_name: string;
  siret: string;
  company_address: string;
  phone: string;
  email: string;
  website?: string;
  is_verified: boolean;
  verification_status: 'not_started' | 'in_progress' | 'completed';
  verified_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

interface VerificationDocument {
  id: number;
  professional_account_id: number;
  document_type: 'kbis' | 'siret' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
}

interface AdminDashboardProps {
  onBack?: () => void;
}

export const AdminDashboardClean: React.FC<AdminDashboardProps> = ({ onBack }) => {
  // Déconnexion admin
  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onBack) onBack();
  };

  // Lire le paramètre tab de l'URL pour initialiser activeTab
  const getInitialTab = (): 'dashboard' | 'users' | 'annonces' | 'moderation' | 'performance' | 'pro-accounts' | 'payments' | 'reports' => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const validTabs = ['dashboard', 'users', 'annonces', 'moderation', 'performance', 'pro-accounts', 'payments', 'reports'];
    return validTabs.includes(tab || '') ? tab as any : 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'annonces' | 'moderation' | 'performance' | 'pro-accounts' | 'payments' | 'reports'>(getInitialTab());
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAnnonces: 0,
    recentActivity: 0,
    monthlyGrowth: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [pendingAnnonces, setPendingAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [professionalAccounts, setProfessionalAccounts] = useState<ProfessionalAccount[]>([]);
  const [selectedProAccount, setSelectedProAccount] = useState<ProfessionalAccount | null>(null);
  const [pendingProAccountsCount, setPendingProAccountsCount] = useState<number>(0);
  const [proAccountDocuments, setProAccountDocuments] = useState<VerificationDocument[]>([]);
  const [verificationAction, setVerificationAction] = useState<{accountId: number, action: 'approve' | 'reject', reason?: string} | null>(null);
  const [globalPurchaseHistory, setGlobalPurchaseHistory] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [previewAnnonce, setPreviewAnnonce] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isApproving, setIsApproving] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'performance') {
      loadPerformanceData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Chargement des données admin...');
      const vehiclesRes = await fetch('/api/vehicles');
      const vehiclesData = await vehiclesRes.json();
      console.log('📊 Données véhicules reçues:', vehiclesData.length);
      
      // Récupérer aussi les annonces supprimées depuis Supabase
      const deletedRes = await fetch('/api/admin/deleted-annonces');
      const deletedData = deletedRes.ok ? await deletedRes.json() : [];
      console.log('🗑️ Annonces supprimées récupérées:', deletedData.length);
      
      // Récupérer TOUS les utilisateurs depuis la base
      const usersRes = await fetch(`/api/admin/all-users?t=${Date.now()}`);
      const allUsers = usersRes.ok ? await usersRes.json() : [];
      console.log('👥 TOUS les utilisateurs récupérés:', allUsers.length);
      
      // Formater les utilisateurs
      const formattedUsers = allUsers.map((user: any) => ({
        id: user.id,
        name: user.name || 'Utilisateur',
        email: user.email || `${user.id}@auto2roues.com`,
        type: user.account_type || 'individual',
        verified: user.verified || false,
        emailVerified: user.email_verified || false,
        createdAt: user.created_at || new Date().toISOString()
      }));

      // Convertir les véhicules en format annonces
      const annoncesData = vehiclesData.map((vehicle: any) => ({
        id: vehicle.id,
        title: vehicle.title,
        user: vehicle.user,
        status: 'active',
        price: vehicle.price || 0,
        createdAt: vehicle.created_at || vehicle.createdAt || new Date().toISOString()
      }));
      
      // Ajouter les annonces supprimées
      const deletedAnnoncesData = deletedData.map((annonce: any) => ({
        id: annonce.id,
        title: annonce.title,
        user: annonce.users || { name: 'Utilisateur supprimé' },
        status: 'deleted',
        price: annonce.price || 0,
        createdAt: annonce.created_at,
        deletedAt: annonce.deleted_at,
        deletionReason: annonce.deletion_reason
      }));
      
      // Combiner toutes les annonces
      const allAnnonces = [...annoncesData, ...deletedAnnoncesData];

      console.log('👥 Utilisateurs totaux:', formattedUsers.length);
      console.log('📄 Annonces:', annoncesData.length);

      setUsers(formattedUsers);
      setAnnonces(allAnnonces);
      
      // Charger le count des comptes en attente pour le badge
      loadPendingProAccountsCount();
      
      // Toujours charger les annonces en attente pour avoir le bon compteur dans le badge
      loadPendingAnnonces();
      
      // Charger aussi les comptes professionnels si c'est l'onglet actif
      if (activeTab === 'pro-accounts') {
        loadProfessionalAccounts();
      }

      setStats({
        totalUsers: formattedUsers.length,
        totalAnnonces: allAnnonces.length,
        recentActivity: 2,
        monthlyGrowth: 15
      });

      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement admin:', error);
      setLoading(false);
    }
  };

  // Fonction pour charger l'historique global des paiements
  const loadGlobalPurchaseHistory = async () => {
    setLoadingPayments(true);
    try {
      const response = await fetch('/api/admin/purchase-history');
      if (response.ok) {
        const history = await response.json();
        setGlobalPurchaseHistory(history);
        console.log('💰 Historique global des paiements chargé:', history.length);
      } else {
        console.error('Error fetching global purchase history');
        setGlobalPurchaseHistory([]);
      }
    } catch (error) {
      console.error('Error fetching global purchase history:', error);
      setGlobalPurchaseHistory([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      console.log('🔄 Chargement données performance...');
      const response = await fetch('/api/admin/performance-stats');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Données performance reçues:', data);
        setPerformanceData(data);
      } else {
        console.error('❌ Erreur HTTP:', response.status);
        // Mettre des données par défaut
        setPerformanceData({
          soldOnSite: 0,
          soldOnSitePercent: 0,
          soldElsewhere: 0, 
          soldElsewherePercent: 0,
          noLongerSelling: 0,
          noLongerSellingPercent: 0,
          other: 0,
          otherPercent: 0,
          totalDeleted: 0,
          averageDays: 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement performance:', error);
      // Mettre des données par défaut même en cas d'erreur
      setPerformanceData({
        soldOnSite: 0,
        soldOnSitePercent: 0,
        soldElsewhere: 0, 
        soldElsewherePercent: 0,
        noLongerSelling: 0,
        noLongerSellingPercent: 0,
        other: 0,
        otherPercent: 0,
        totalDeleted: 0,
        averageDays: 0
      });
    }
  };

  const handleAnnonceView = (annonceId: string) => {
    // Ouvrir la page principale avec le véhicule sélectionné via paramètres URL
    const currentDomain = window.location.origin;
    window.open(`${currentDomain}/?vehicle=${annonceId}`, '_blank');
  };

  const handleAnnonceDeactivate = async (annonceId: string) => {
    // Message de confirmation
    const confirmation = window.confirm(
      '⚠️ Êtes-vous sûr de vouloir désactiver cette annonce ?\n\n' +
      'Cette action va :\n' +
      '• Masquer l\'annonce du site public\n' +
      '• Marquer l\'annonce comme inactive dans la base de données\n\n' +
      'Voulez-vous continuer ?'
    );
    
    if (!confirmation) {
      console.log('❌ Désactivation annulée par l\'admin');
      return;
    }

    try {
      const adminEmail = localStorage.getItem('admin_email') || 'admin@passionauto2roues.com';
      const response = await fetch(`/api/admin/annonces/${annonceId}/deactivate`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': adminEmail,
          'authorization': `admin:${adminEmail}`
        }
      });
      if (response.ok) {
        console.log(`✅ Annonce ${annonceId} désactivée avec succès`);
        alert('✅ Annonce désactivée avec succès !');
        loadDashboardData();
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur désactivation:', errorData);
        alert(`❌ Erreur: ${errorData.error || 'Impossible de désactiver l\'annonce'}`);
      }
    } catch (error) {
      console.error('❌ Erreur désactivation:', error);
      alert('❌ Erreur réseau lors de la désactivation');
    }
  };



  const handleUserAction = async (userId: string, action: 'verify_email' | 'activate' | 'suspend') => {
    try {
      console.log(`🔐 Action ${action} pour utilisateur ${userId}...`);
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Action réussie:', result.message);
        alert(`✅ ${result.message}`);
        // Attendre un peu puis recharger pour voir les changements
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur action utilisateur:', errorData);
        alert(`❌ Erreur: ${errorData.error || 'Erreur lors de l\'action'}`);
      }
    } catch (error) {
      console.error('Erreur action utilisateur:', error);
      alert('❌ Erreur lors de l\'action');
    }
  };

  const handleAnnonceAction = async (annonceId: string, action: 'approve' | 'reject' | 'suspend') => {
    try {
      const response = await fetch(`/api/admin/annonces/${annonceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Erreur action annonce:', error);
    }
  };

  const loadProfessionalAccounts = async () => {
    try {
      console.log('🏢 Chargement comptes professionnels...');
      const response = await fetch('/api/admin/professional-accounts');
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 ${data.length} comptes professionnels reçus`);
        setProfessionalAccounts(data);
      }
    } catch (error) {
      console.error('Erreur chargement comptes pro:', error);
    }
  };

  const loadPendingProAccountsCount = async () => {
    try {
      console.log('🔢 Chargement nombre comptes en attente...');
      const response = await fetch('/api/admin/professional-accounts/pending-count');
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 ${data.pendingCount} comptes en attente trouvés`);
        setPendingProAccountsCount(data.pendingCount);
      }
    } catch (error) {
      console.error('Erreur chargement count comptes en attente:', error);
    }
  };

  const loadPendingAnnonces = async () => {
    setLoadingModeration(true);
    try {
      console.log('🔄 Chargement des annonces en attente...');
      const response = await fetch('/api/admin/pending-annonces');
      if (response.ok) {
        const data = await response.json();
        console.log(`📋 ${data.length} annonce(s) en attente trouvées`);
        
        // Formater les données pour l'affichage
        const formattedPendingAnnonces = data.map((vehicle: any) => ({
          id: vehicle.id,
          title: vehicle.title,
          user: vehicle.user,
          status: vehicle.status,
          price: vehicle.price || 0,
          createdAt: vehicle.created_at || vehicle.createdAt || new Date().toISOString(),
          category: vehicle.category,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          images: vehicle.images || []
        }));
        
        setPendingAnnonces(formattedPendingAnnonces);
      } else {
        console.error('Erreur lors du chargement des annonces en attente');
      }
    } catch (error) {
      console.error('Erreur chargement annonces en attente:', error);
    } finally {
      setLoadingModeration(false);
    }
  };

  const approveAnnonce = async (annonceId: string) => {
    try {
      console.log(`✅ Approbation de l'annonce ${annonceId}...`);
      const response = await fetch(`/api/admin/annonces/${annonceId}/approve`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        console.log(`✅ Annonce ${annonceId} approuvée avec succès`);
        // Recharger les annonces en attente
        loadPendingAnnonces();
      } else {
        console.error('Erreur lors de l\'approbation de l\'annonce');
      }
    } catch (error) {
      console.error('Erreur approbation annonce:', error);
    }
  };

  const rejectAnnonce = async (annonceId: string, reason?: string) => {
    try {
      console.log(`❌ Rejet de l'annonce ${annonceId}...`);
      const response = await fetch(`/api/admin/annonces/${annonceId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        console.log(`❌ Annonce ${annonceId} rejetée avec succès`);
        // Recharger les annonces en attente
        loadPendingAnnonces();
      } else {
        console.error('Erreur lors du rejet de l\'annonce');
      }
    } catch (error) {
      console.error('Erreur rejet annonce:', error);
    }
  };

  const loadAnnonceDetails = async (annonceId: string) => {
    try {
      console.log(`🔍 Chargement détails de l'annonce ${annonceId}...`);
      const response = await fetch(`/api/vehicles/${annonceId}`);
      if (response.ok) {
        const annonceDetails = await response.json();
        console.log('📋 Détails annonce chargés:', annonceDetails);
        setPreviewAnnonce(annonceDetails);
        setShowPreviewModal(true);
      } else {
        console.error('Erreur lors du chargement des détails de l\'annonce');
        alert('Erreur lors du chargement des détails de l\'annonce');
      }
    } catch (error) {
      console.error('Erreur chargement détails annonce:', error);
      alert('Erreur lors du chargement des détails de l\'annonce');
    }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewAnnonce(null);
  };

  const loadProAccountDocuments = async (accountId: number) => {
    try {
      console.log(`📄 Chargement documents pour compte ${accountId}...`);
      const response = await fetch(`/api/admin/professional-accounts/${accountId}/documents`);
      if (response.ok) {
        const data = await response.json();
        console.log(`📄 ${data.length} documents reçus`);
        setProAccountDocuments(data);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const handleVerifyProAccount = async (accountId: number, action: 'approve' | 'reject', reason?: string) => {
    // Protection contre les clics multiples
    if (isApproving === accountId) {
      console.log('⚠️ Traitement déjà en cours pour ce compte');
      return;
    }

    setIsApproving(accountId);
    
    try {
      console.log(`🔍 ${action} compte pro ${accountId}...`);
      const response = await fetch(`/api/admin/professional-accounts/${accountId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vérification réussie:', result.message);
        alert(`✅ ${result.message}`);
        loadProfessionalAccounts(); // Recharger la liste
        setVerificationAction(null);
        if (selectedProAccount?.id === accountId) {
          setSelectedProAccount(null); // Fermer le détail
        }
      } else {
        console.error('❌ Erreur vérification');
        alert('❌ Erreur lors de la vérification');
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
      alert('❌ Erreur lors de la vérification');
    } finally {
      // Toujours débloquer, même en cas d'erreur
      setIsApproving(null);
    }
  };



  const handleViewDocument = async (document: VerificationDocument) => {
    try {
      console.log(`🔗 Ouverture document: ${document.file_url}`);
      
      // Construire l'URL publique directement
      const publicUrl = `https://dhzcpxbzzkyvrmxqklye.supabase.co/storage/v1/object/public/vehicle-images/${document.file_url}`;
      console.log(`🌐 URL publique: ${publicUrl}`);
      
      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('❌ Erreur ouverture document:', error);
      alert('❌ Impossible d\'ouvrir le document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord administrateur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin - SANS le header normal */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-500" />
                <h1 className="text-2xl font-bold text-gray-900">Administration Passion Auto2Roues</h1>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Super Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Connecté en tant que : {localStorage.getItem('admin_email')}
              </span>
              <button 
                onClick={handleLogout}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Déconnexion
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm h-screen">
          <div className="p-6">
            <div className="space-y-2">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
                { id: 'users', label: 'Utilisateurs', icon: Users },
                { id: 'annonces', label: 'Annonces', icon: FileText },
                { id: 'moderation', label: 'Modération', icon: Shield, badge: pendingAnnonces.length > 0 ? pendingAnnonces.length : undefined },
                { id: 'reports', label: 'Signalements', icon: Flag },
                { id: 'payments', label: 'Paiements', icon: CreditCard },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'pro-accounts', label: 'Comptes Pro', icon: Building2 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id === 'pro-accounts') {
                      loadProfessionalAccounts();
                    } else if (item.id === 'payments') {
                      loadGlobalPurchaseHistory();
                    } else if (item.id === 'moderation') {
                      loadPendingAnnonces();
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'pro-accounts' && pendingProAccountsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-auto">
                      {pendingProAccountsCount}
                    </span>
                  )}
                  {item.id === 'moderation' && pendingAnnonces.length > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 ml-auto">
                      {pendingAnnonces.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
                <p className="text-gray-600">Vue d'ensemble de la plateforme</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Annonces</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalAnnonces}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Carte statistique signalements supprimée */}

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Croissance</p>
                      <p className="text-3xl font-bold text-gray-900">+{stats.monthlyGrowth}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Activité récente */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Nouvelle inscription: User Démo</p>
                        <p className="text-xs text-gray-500">Il y a 2 heures</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Nouvelle annonce publiée</p>
                        <p className="text-xs text-gray-500">Il y a 4 heures</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h2>
                <div className="text-sm text-gray-600">
                  {users.length} utilisateur(s) au total
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Utilisateur</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Statut</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Inscription</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.verified 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {user.verified ? '✅ Actif' : '❌ Inactif'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {!user.verified && (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                                  title="Confirmer l'email et activer le compte"
                                >
                                  ✅ Activer
                                </button>
                              )}
                              {user.verified && (
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                                  title="Suspendre le compte (email non confirmé)"
                                >
                                  ❌ Suspendre
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'annonces' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Liste des Annonces</h2>
                <div className="text-sm text-gray-600">
                  {annonces.length} annonce(s) au total
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Annonce</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Vendeur</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Prix</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Statut</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {annonces.map((annonce) => (
                        <tr key={annonce.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{annonce.title}</div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {annonce.user?.name || 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            {annonce.price ? `${annonce.price.toLocaleString('fr-FR')} €` : 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              annonce.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : annonce.status === 'deleted'
                                ? 'bg-gray-100 text-gray-700'
                                : annonce.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {annonce.status === 'active' ? 'Active' : 
                               annonce.status === 'deleted' ? '🗑️ Supprimée' :
                               annonce.status === 'pending' ? 'En attente' : 'Suspendue'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {new Date(annonce.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              {annonce.status === 'deleted' ? (
                                // Annonces supprimées : seulement voir
                                <button
                                  onClick={() => handleAnnonceView(annonce.id)}
                                  className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                  title="Voir annonce"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : (
                                // Annonces actives : toutes les actions
                                <>
                                  
                                  <button
                                    onClick={() => handleAnnonceDeactivate(annonce.id)}
                                    className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                    title="Désactiver"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleAnnonceView(annonce.id)}
                                    className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                    title="Voir annonce"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Modération des annonces</h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {pendingAnnonces.length} annonce(s) en attente
                  </div>
                  <button
                    onClick={loadPendingAnnonces}
                    disabled={loadingModeration}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {loadingModeration ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>
              </div>

              {loadingModeration ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Chargement des annonces en attente...</p>
                </div>
              ) : pendingAnnonces.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune annonce en attente</h3>
                  <p className="text-gray-500">Toutes les annonces ont été traitées !</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Annonce
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date de création
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingAnnonces.map((annonce) => (
                          <tr key={annonce.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  {annonce.images && annonce.images.length > 0 ? (
                                    <img
                                      className="h-12 w-12 rounded-lg object-cover"
                                      src={annonce.images[0]}
                                      alt={annonce.title}
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                      <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {annonce.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {annonce.brand} {annonce.model} • {annonce.year}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{annonce.user?.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{annonce.user?.email || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                annonce.status === 'draft' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : annonce.status === 'pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {annonce.status === 'draft' && '📝 Brouillon'}
                                {annonce.status === 'pending' && '⏳ En attente'}
                                {annonce.status !== 'draft' && annonce.status !== 'pending' && annonce.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(annonce.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => loadAnnonceDetails(annonce.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
                                title="Voir l'annonce complète"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => approveAnnonce(annonce.id)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                                title="Approuver l'annonce"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Raison du rejet (optionnel):');
                                  rejectAnnonce(annonce.id, reason || undefined);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                                title="Rejeter l'annonce"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Signalements */}
          {activeTab === 'reports' && (
            <ReportsSection />
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Performance des annonces</h2>
                <div className="text-sm text-gray-600">
                  Statistiques basées sur le questionnaire de suppression
                </div>
              </div>

              {performanceData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Vendues sur le site</p>
                        <p className="text-3xl font-bold text-green-600">{performanceData.soldOnSite || 0}</p>
                        <p className="text-sm text-gray-500">{performanceData.soldOnSitePercent || 0}% du total</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Vendues ailleurs</p>
                        <p className="text-3xl font-bold text-orange-600">{performanceData.soldElsewhere || 0}</p>
                        <p className="text-sm text-gray-500">{performanceData.soldElsewherePercent || 0}% du total</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ne souhaite plus vendre</p>
                        <p className="text-3xl font-bold text-blue-600">{performanceData.noLongerSelling || 0}</p>
                        <p className="text-sm text-gray-500">{performanceData.noLongerSellingPercent || 0}% du total</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <XCircle className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Autres raisons</p>
                        <p className="text-3xl font-bold text-purple-600">{performanceData.other || 0}</p>
                        <p className="text-sm text-gray-500">{performanceData.otherPercent || 0}% du total</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement des données...</h3>
                  <p className="text-gray-600">Veuillez patienter</p>
                </div>
              )}

              {performanceData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">Durée moyenne avant suppression</h3>
                    </div>
                    <div className="p-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-indigo-600 mb-2">{performanceData.averageDays || 0}</p>
                        <p className="text-gray-600">jours en moyenne</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">Total suppressions</h3>
                    </div>
                    <div className="p-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900 mb-2">{performanceData.totalDeleted || 0}</p>
                        <p className="text-gray-600">annonces supprimées</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section signalements supprimée */}

          {activeTab === 'pro-accounts' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Comptes Professionnels</h2>
                  <p className="text-gray-600">Gestion et validation des comptes professionnels</p>
                </div>
                <div className="text-sm text-gray-500">
                  {professionalAccounts.length} comptes • {professionalAccounts.filter(acc => acc.verification_status === 'pending').length} en attente
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En attente</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {professionalAccounts.filter(acc => acc.verification_status === 'pending').length}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approuvés</p>
                      <p className="text-3xl font-bold text-green-600">
                        {professionalAccounts.filter(acc => acc.verification_status === 'approved').length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejetés</p>
                      <p className="text-3xl font-bold text-red-600">
                        {professionalAccounts.filter(acc => acc.verification_status === 'rejected').length}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des comptes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Demandes de comptes professionnels</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Compte
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entreprise
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SIRET
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {professionalAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              {account.users && (
                                <>
                                  <div className="text-sm font-medium text-gray-900">{account.users.email}</div>
                                  <div className="text-xs text-gray-400">👤 {account.users.name}</div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{account.company_name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{account.company_address}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono">{account.siret}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{account.email}</div>
                              <div className="text-sm text-gray-500">{account.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              account.verification_status === 'pending'
                                ? 'bg-orange-100 text-orange-800'
                                : account.verification_status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {account.verification_status === 'pending' && '⏳ En attente'}
                              {account.verification_status === 'approved' && '✅ Approuvé'}
                              {account.verification_status === 'not_verified' && '❌ Non vérifié'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(account.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProAccount(account);
                                loadProAccountDocuments(account.id);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </button>
                            {account.verification_status === 'pending' && (
                              <div className="inline-flex space-x-1">
                                <button
                                  onClick={() => handleVerifyProAccount(account.id, 'approve')}
                                  disabled={isApproving === account.id}
                                  className={`inline-flex items-center px-3 py-1 border rounded-md text-sm transition-colors ${
                                    isApproving === account.id
                                      ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                                      : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                  }`}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {isApproving === account.id ? '⏳ En cours...' : 'Approuver'}
                                </button>
                                <button
                                  onClick={() => setVerificationAction({ accountId: account.id, action: 'reject' })}
                                  disabled={isApproving === account.id}
                                  className={`inline-flex items-center px-3 py-1 border rounded-md text-sm transition-colors ${
                                    isApproving === account.id
                                      ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                                      : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                  }`}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Rejeter
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {professionalAccounts.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun compte professionnel pour le moment</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal de détail de compte */}
              {selectedProAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Détails du compte professionnel
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedProAccount(null);
                          setProAccountDocuments([]);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Informations de l'entreprise</h4>
                        <div>
                          <label className="text-sm text-gray-600">Nom de l'entreprise</label>
                          <p className="font-medium">{selectedProAccount.company_name}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">SIRET</label>
                          <p className="font-mono">{selectedProAccount.siret}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Adresse</label>
                          <p>{selectedProAccount.company_address}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Site web</label>
                          <p>{selectedProAccount.website || 'Non renseigné'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Contact</h4>
                        <div>
                          <label className="text-sm text-gray-600">Email</label>
                          <p>{selectedProAccount.email}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Téléphone</label>
                          <p>{selectedProAccount.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Utilisateur associé</label>
                          <p>{selectedProAccount.users?.name || 'Non trouvé'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Statut</label>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedProAccount.verification_status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : selectedProAccount.verification_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedProAccount.verification_status === 'pending' && '⏳ En attente'}
                            {selectedProAccount.verification_status === 'approved' && '✅ Approuvé'}
                            {selectedProAccount.verification_status === 'rejected' && '❌ Rejeté'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Documents de vérification */}
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Documents de vérification</h4>
                      {proAccountDocuments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {proAccountDocuments.map((doc) => (
                            <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {doc.document_type === 'kbis' ? 'K-bis' : 
                                   doc.document_type === 'siret' ? 'SIRET' : 'Autre'}
                                </h5>
                                <button
                                  onClick={() => handleViewDocument(doc)}
                                  className="inline-flex items-center px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Ouvrir
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • 
                                {new Date(doc.upload_date).toLocaleDateString('fr-FR')}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full mt-2 ${
                                doc.verification_status === 'pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : doc.verification_status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {doc.verification_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Aucun document trouvé</p>
                      )}
                    </div>

                    {/* Actions pour compte en attente */}
                    {selectedProAccount.verification_status === 'pending' && (
                      <div className="flex space-x-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleVerifyProAccount(selectedProAccount.id, 'approve')}
                          disabled={isApproving === selectedProAccount.id}
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                            isApproving === selectedProAccount.id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isApproving === selectedProAccount.id ? '⏳ En cours...' : '✅ Approuver le compte'}
                        </button>
                        <button
                          onClick={() => setVerificationAction({ accountId: selectedProAccount.id, action: 'reject' })}
                          disabled={isApproving === selectedProAccount.id}
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                            isApproving === selectedProAccount.id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          ❌ Rejeter le compte
                        </button>
                      </div>
                    )}

                    {/* Détails du rejet si rejeté */}
                    {selectedProAccount.verification_status === 'rejected' && selectedProAccount.rejected_reason && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="font-medium text-red-800 mb-2">Raison du rejet</h5>
                        <p className="text-red-700">{selectedProAccount.rejected_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal de rejet */}
              {verificationAction?.action === 'reject' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Rejeter le compte professionnel
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Veuillez indiquer la raison du rejet :
                    </p>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={4}
                      placeholder="Raison du rejet..."
                      onChange={(e) => setVerificationAction({
                        ...verificationAction,
                        reason: e.target.value
                      })}
                    />
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={() => setVerificationAction(null)}
                        disabled={isApproving === verificationAction.accountId}
                        className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                          isApproving === verificationAction.accountId
                            ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          if (verificationAction.reason?.trim()) {
                            handleVerifyProAccount(verificationAction.accountId, 'reject', verificationAction.reason);
                          } else {
                            alert('Veuillez indiquer une raison');
                          }
                        }}
                        disabled={isApproving === verificationAction.accountId}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          isApproving === verificationAction.accountId
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {isApproving === verificationAction.accountId ? '⏳ En cours...' : 'Confirmer le rejet'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Paiements */}
          {activeTab === 'payments' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Historique des Paiements</h2>
                  <p className="text-gray-600">Tous les paiements validés (boost + abonnements professionnels)</p>
                </div>
                <div className="text-sm text-gray-500">
                  {globalPurchaseHistory.length} paiement{globalPurchaseHistory.length !== 1 ? 's' : ''}
                </div>
              </div>

              {loadingPayments ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Chargement des paiements...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Statistiques de revenus */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenus</p>
                          <p className="text-3xl font-bold text-green-600">
                            {globalPurchaseHistory.reduce((total, purchase) => total + purchase.amount, 0).toFixed(2)}€
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Euro className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Revenus Boost</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {globalPurchaseHistory.filter(p => p.type === 'boost').reduce((total, purchase) => total + purchase.amount, 0).toFixed(2)}€
                          </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Zap className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Revenus Abonnements</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {globalPurchaseHistory.filter(p => p.type === 'subscription').reduce((total, purchase) => total + purchase.amount, 0).toFixed(2)}€
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Crown className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nb Paiements</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {globalPurchaseHistory.length}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <CreditCard className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table des paiements */}
                  {globalPurchaseHistory.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                      <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun paiement</h3>
                      <p className="text-gray-600">Aucun paiement n'a été effectué pour le moment.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Détail des paiements</h3>
                        <p className="text-gray-600 mt-1">Liste chronologique de tous les paiements validés</p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="text-left py-3 px-6 font-medium text-gray-600">Utilisateur</th>
                              <th className="text-left py-3 px-6 font-medium text-gray-600">Type</th>
                              <th className="text-left py-3 px-6 font-medium text-gray-600">Description</th>
                              <th className="text-left py-3 px-6 font-medium text-gray-600">Montant</th>
                              <th className="text-left py-3 px-6 font-medium text-gray-600">Date</th>
                              <th className="text-left py-3 px-6 font-medium text-gray-600">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {globalPurchaseHistory.map((purchase, index) => (
                              <tr key={purchase.id} className="hover:bg-gray-50">
                                <td className="py-4 px-6">
                                  <div>
                                    <div className="font-medium text-gray-900">{purchase.userName}</div>
                                    <div className="text-sm text-gray-500">{purchase.userEmail}</div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-2">
                                    {purchase.type === 'boost' ? (
                                      <div className="bg-orange-100 p-1 rounded">
                                        <Zap className="h-4 w-4 text-orange-600" />
                                      </div>
                                    ) : (
                                      <div className="bg-blue-100 p-1 rounded">
                                        <Crown className="h-4 w-4 text-blue-600" />
                                      </div>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      purchase.type === 'boost' 
                                        ? 'bg-orange-100 text-orange-700' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {purchase.type === 'boost' ? 'Boost' : 'Abonnement'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div>
                                    <div className="font-medium text-gray-900">{purchase.title}</div>
                                    <div className="text-sm text-gray-500">{purchase.description}</div>
                                    {purchase.duration && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        Durée: {purchase.duration} jour{purchase.duration !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="text-lg font-bold text-gray-900">
                                    {purchase.amount.toFixed(2)}€
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600">
                                  {new Date(purchase.date).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    purchase.status === 'completed' 
                                      ? 'bg-green-100 text-green-800'
                                      : purchase.status === 'active'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {purchase.status === 'completed' ? '✅ Payé' : 
                                     purchase.status === 'active' ? '🔄 Actif' : purchase.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal de prévisualisation d'annonce */}
      {showPreviewModal && previewAnnonce && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header de la modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{previewAnnonce.title}</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {previewAnnonce.price ? `${previewAnnonce.price.toLocaleString('fr-FR')} €` : 'Prix non défini'}
                </p>
              </div>
              <button
                onClick={closePreviewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenu de la modal */}
            <div className="p-6">
              {/* Images */}
              {previewAnnonce.images && previewAnnonce.images.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Images ({previewAnnonce.images.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewAnnonce.images.map((image: string, index: number) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations du véhicule</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Marque:</span> {previewAnnonce.brand || 'Non spécifié'}</div>
                    <div><span className="font-medium">Modèle:</span> {previewAnnonce.model || 'Non spécifié'}</div>
                    <div><span className="font-medium">Année:</span> {previewAnnonce.year || 'Non spécifié'}</div>
                    <div><span className="font-medium">Kilométrage:</span> {previewAnnonce.mileage ? `${previewAnnonce.mileage.toLocaleString('fr-FR')} km` : 'Non spécifié'}</div>
                    <div><span className="font-medium">Carburant:</span> {previewAnnonce.fuel || 'Non spécifié'}</div>
                    <div><span className="font-medium">Transmission:</span> {previewAnnonce.transmission || 'Non spécifié'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations du vendeur</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nom:</span> {previewAnnonce.user?.name || 'Non spécifié'}</div>
                    <div><span className="font-medium">Email:</span> {previewAnnonce.user?.email || 'Non spécifié'}</div>
                    <div><span className="font-medium">Téléphone:</span> {previewAnnonce.phone || 'Non spécifié'}</div>
                    <div><span className="font-medium">Localisation:</span> {previewAnnonce.location || 'Non spécifié'}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {previewAnnonce.description && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{previewAnnonce.description}</p>
                </div>
              )}

              {/* Équipements */}
              {previewAnnonce.features && previewAnnonce.features.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Équipements</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {previewAnnonce.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
              <button
                onClick={closePreviewModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  approveAnnonce(previewAnnonce.id);
                  closePreviewModal();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approuver</span>
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Raison du rejet (optionnel):');
                  if (reason !== null) {
                    rejectAnnonce(previewAnnonce.id, reason || undefined);
                    closePreviewModal();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Rejeter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};