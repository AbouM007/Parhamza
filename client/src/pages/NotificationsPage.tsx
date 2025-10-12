import { useState } from "react";
import { Bell, Check, X, MessageCircle, Heart, AlertCircle, CheckCircle, Filter } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Notification } from "@shared/schema";
import { MobilePageHeader } from "@/components/MobilePageHeader";

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }

    if (notification.data) {
      const data = notification.data as any;
      
      switch (notification.type) {
        case 'new_message':
        case 'message_reply':
          if (data.conversationId) {
            setLocation(`/messages?conversation=${data.conversationId}`);
          } else {
            setLocation('/messages');
          }
          break;
        
        case 'listing_validated':
        case 'listing_rejected':
        case 'listing_favorited':
        case 'listing_expiring':
          if (data.listingId) {
            setLocation(`/vehicle/${data.listingId}`);
          }
          break;
        
        case 'new_follower':
          if (data.followerId) {
            setLocation(`/professional/${data.followerId}`);
          }
          break;
        
        case 'followed_new_listing':
          if (data.listingId) {
            setLocation(`/vehicle/${data.listingId}`);
          }
          break;
        
        case 'payment_success':
        case 'payment_failed':
        case 'subscription_ending':
          setLocation('/subscription-settings');
          break;
        
        default:
          break;
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>, notificationId: number) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
      case 'message_reply':
        return <MessageCircle className="h-5 w-5 text-primary-bolt-500" />;
      
      case 'listing_validated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      
      case 'listing_rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      
      case 'listing_favorited':
        return <Heart className="h-5 w-5 text-pink-500" />;
      
      case 'new_follower':
      case 'followed_new_listing':
        return <Bell className="h-5 w-5 text-blue-500" />;
      
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobilePageHeader 
        title="Notifications" 
        onBack={() => setLocation("/")} 
      />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8 hidden lg:block">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3" data-testid="title-notifications">
            <Bell className="h-8 w-8 text-primary-bolt-500" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 
              ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : "Vous êtes à jour avec toutes vos notifications"}
          </p>
        </div>

        {/* Barre d'actions et filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Filtres */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-bolt-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid="filter-all"
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-primary-bolt-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid="filter-unread"
                >
                  Non lues ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'read'
                      ? 'bg-primary-bolt-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid="filter-read"
                >
                  Lues ({notifications.length - unreadCount})
                </button>
              </div>
            </div>

            {/* Action marquer tout comme lu */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                data-testid="button-mark-all-read"
              >
                <Check className="h-4 w-4" />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-bolt-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement des notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Bell className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">
                {filter === 'all' && "Aucune notification"}
                {filter === 'unread' && "Aucune notification non lue"}
                {filter === 'read' && "Aucune notification lue"}
              </p>
              <p className="text-sm text-gray-400">
                {filter === 'all' && "Vous recevrez vos notifications ici"}
                {filter === 'unread' && "Toutes vos notifications sont lues !"}
                {filter === 'read' && "Vous n'avez pas encore lu de notifications"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50
                    ${!notification.read ? 'bg-blue-50 border-l-4 border-primary-bolt-500' : ''}
                  `}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className={`text-base ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </p>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Non lue
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Supprimer la notification"
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer informatif */}
        {filteredNotifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Affichage de {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
