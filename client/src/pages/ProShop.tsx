import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowers } from "@/hooks/useFollowers";
import { 
  Building2, Globe, Phone, Mail, MapPin, Star, 
  Eye, Heart, Filter, Grid, List,
  ChevronDown, Award, Shield, Verified,
  Image as ImageIcon, PaintBucket, Settings, UserPlus, UserCheck
} from 'lucide-react';
import { getUserDisplayName } from "@/lib/utils";

interface ProAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  company_name?: string;
  avatar?: string;
  siret?: string;
  bio?: string;
  type: string;
  verified?: boolean;
  created_at: string;
  followers_count?: number;
}

interface Vehicle {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  brand: string;
  model: string;
  year: number;
  mileage?: number;
  location: string;
  created_at: string;
  views: number;
  is_premium: boolean;
  status: string;
  is_active: boolean;
}

export default function ProShop() {
  const [match, params] = useRoute('/pro/:shopId');
  const { setSelectedVehicle } = useApp();
  const { profile } = useAuth();
  const { toggleFollow, useIsFollowing, isFollowPending, isUnfollowPending } = useFollowers();
  const [proAccount, setProAccount] = useState<ProAccount | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterCategory, setFilterCategory] = useState('all');

  // Check if current user is following this shop
  const { data: followStatus } = useIsFollowing(proAccount?.id);
  const isFollowing = followStatus?.isFollowing || false;
  const isOwnShop = profile?.id === proAccount?.id;

  // Charger les données de la boutique
  useEffect(() => {
    if (params?.shopId) {
      loadProShopData(params.shopId);
    }
  }, [params?.shopId]);

  const loadProShopData = async (shopId: string) => {
    try {
      setLoading(true);
      console.log('🏪 Chargement boutique pro ID (user ID):', shopId);
      
      // Récupérer directement les données utilisateur depuis la table users
      const userResponse = await fetch(`/api/users/${shopId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Vérifier que c'est bien un utilisateur professionnel
        if (userData.type === 'professional') {
          console.log('✅ Utilisateur professionnel trouvé:', userData.company_name);
          console.log('📅 Date création utilisateur:', userData.created_at);
          setProAccount(userData);
          
          // Récupérer les véhicules de cet utilisateur
          const vehiclesResponse = await fetch(`/api/vehicles/user/${shopId}`);
          if (vehiclesResponse.ok) {
            const vehiclesData = await vehiclesResponse.json();
            console.log('🚗 Véhicules récupérés:', vehiclesData.length);
            console.log('🔍 Premier véhicule exemple:', vehiclesData[0]);
            // Filtrer pour n'afficher que les véhicules actifs et approuvés/actifs
            const activeVehicles = vehiclesData.filter((v: any) => {
              const isActiveCheck = v.isActive !== false && !v.deletedAt;
              const statusCheck = ['approved', 'active'].includes(v.status);
              console.log(`Véhicule ${v.title}: isActive=${v.isActive}, status=${v.status}, deletedAt=${v.deletedAt}`);
              return isActiveCheck && statusCheck;
            });
            console.log(`✅ ${activeVehicles.length} véhicules actifs sur ${vehiclesData.length} total`);
            setVehicles(activeVehicles);
          }
          
          setLoading(false);
          return;
        } else {
          console.log('⚠️ L\'utilisateur n\'est pas un professionnel');
        }
      } else {
        console.log('⚠️ Utilisateur non trouvé');
      }

      // Si pas trouvé ou pas professionnel, afficher une erreur
      console.error('❌ Impossible de charger la boutique pro');
      setProAccount(null);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement boutique pro:', error);
      setProAccount(null);
      setLoading(false);
    }
  };

  const filteredAndSortedVehicles = vehicles
    .filter(vehicle => {
      if (filterCategory === 'all') return true;
      return vehicle.category === filterCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const categories = [...new Set(vehicles.map(v => v.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-bolt-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!proAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Boutique non trouvée</h1>
          <p className="text-gray-600 mb-8">Cette boutique professionnelle n'existe pas ou a été supprimée.</p>
          <Link href="/" className="bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bannière de l'entreprise */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
        
        {/* Informations de l'entreprise */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end space-x-6">
              {/* Logo de l'entreprise */}
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
                {proAccount.avatar ? (
                  <img 
                    src={proAccount.avatar} 
                    alt={getUserDisplayName(proAccount)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              {/* Informations */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-4xl font-bold text-white">{getUserDisplayName(proAccount)}</h1>
                    {proAccount.verified && (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                        <Verified className="h-4 w-4" />
                        <span>Vérifié</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Follow button - only show if not own shop */}
                  {!isOwnShop && proAccount && (
                    <button
                      onClick={() => toggleFollow(proAccount.id, isFollowing)}
                      disabled={isFollowPending || isUnfollowPending}
                      className={`
                        px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2
                        ${isFollowing 
                          ? 'bg-white text-primary-bolt-600 border-2 border-white hover:bg-gray-100' 
                          : 'bg-white text-primary-bolt-600 hover:bg-gray-100'
                        }
                        ${(isFollowPending || isUnfollowPending) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      data-testid={isFollowing ? "button-unfollow-shop" : "button-follow-shop"}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-5 w-5" />
                          <span>Suivi</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          <span>Suivre</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {proAccount.bio && (
                  <p className="text-white text-lg mb-4 max-w-2xl">{proAccount.bio}</p>
                )}
                
                <div className="flex flex-wrap items-center space-x-6 text-white">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>{vehicles.length} annonce{vehicles.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-2" data-testid="followers-count">
                    <UserPlus className="h-5 w-5" />
                    <span>{proAccount.followers_count || 0} abonné{(proAccount.followers_count || 0) > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Informations et contact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-4">
                {(proAccount.address || (proAccount.city && proAccount.postal_code)) && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="text-gray-700">
                      {proAccount.address && <div>{proAccount.address}</div>}
                      {proAccount.city && proAccount.postal_code && (
                        <div>{proAccount.postal_code} {proAccount.city}</div>
                      )}
                    </div>
                  </div>
                )}
                {proAccount.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{proAccount.phone}</span>
                  </div>
                )}
                {proAccount.whatsapp && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{proAccount.whatsapp} (WhatsApp)</span>
                  </div>
                )}
                {proAccount.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a 
                      href={proAccount.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-bolt-500 hover:text-primary-bolt-600"
                    >
                      Site web
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Informations complémentaires */}
            {proAccount.siret && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Informations légales</h2>
                <div className="text-gray-700">
                  <span className="text-sm font-medium">SIRET:</span>
                  <span className="text-sm ml-2">{proAccount.siret}</span>
                </div>
              </div>
            )}
          </div>

          {/* Contenu principal - Annonces */}
          <div className="lg:col-span-3">
            {/* Barre d'outils */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {filteredAndSortedVehicles.length} annonce{filteredAndSortedVehicles.length > 1 ? 's' : ''}
                  </h2>
                  
                  {/* Filtre par catégorie */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Tri */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                  >
                    <option value="date_desc">Plus récentes</option>
                    <option value="date_asc">Plus anciennes</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>

                  {/* Mode d'affichage */}
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary-bolt-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary-bolt-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des annonces */}
            {filteredAndSortedVehicles.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-6"
              }>
                {filteredAndSortedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      viewMode === 'list' ? 'flex' : 'block'
                    }`}
                  >
                    {/* Image */}
                    <div className={viewMode === 'list' ? 'w-80 flex-shrink-0' : 'aspect-[4/3]'}>
                      {vehicle.images.length > 0 ? (
                        <img
                          src={vehicle.images[0]}
                          alt={vehicle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {vehicle.isPremium && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>Premium</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="p-6 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {vehicle.title}
                      </h3>
                      
                      <div className="text-2xl font-bold text-primary-bolt-600 mb-3">
                        {vehicle.price.toLocaleString('fr-FR')} €
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{vehicle.brand} {vehicle.model}</span>
                        <span>{vehicle.year}</span>
                      </div>

                      {vehicle.mileage && (
                        <div className="text-sm text-gray-600 mb-3">
                          {vehicle.mileage.toLocaleString('fr-FR')} km
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{vehicle.location}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{vehicle.views}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune annonce</h3>
                <p className="text-gray-600">
                  Ce professionnel n'a pas encore publié d'annonces.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}