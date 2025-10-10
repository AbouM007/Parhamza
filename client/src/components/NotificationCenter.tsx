import { Bell, Check, X, MessageCircle, Heart, AlertCircle, CheckCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Notification } from "@shared/schema";

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const [, setLocation] = useLocation();

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }

    // Navigation selon le type de notification
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
          // Pas de navigation spécifique
          break;
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 bg-red-500 hover:bg-red-600"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary-bolt-500 hover:text-primary-bolt-600"
              data-testid="button-mark-all-read"
            >
              <Check className="h-4 w-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">Chargement...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 cursor-pointer transition-colors hover:bg-gray-50
                    ${!notification.read ? 'bg-blue-50' : ''}
                  `}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => handleDelete(e, notification.id)}
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-primary-bolt-500 hover:text-primary-bolt-600"
                onClick={() => setLocation('/dashboard')}
                data-testid="button-view-all"
              >
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
