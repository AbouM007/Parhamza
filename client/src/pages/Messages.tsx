import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Image as ImageIcon,
  MessageSquare,
  Bell,
  Check,
  X,
  Heart,
  AlertCircle,
  CheckCircle,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/hooks/useMessaging";
import { useNotifications } from "@/hooks/useNotifications";
import { getUserDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Notification } from "@shared/schema";

interface Conversation {
  id: string;
  vehicle_id: string;
  vehicle_title: string;
  vehicle_price?: number;
  vehicle_image?: string;
  other_user: {
    id: string;
    name: string;
    displayName?: string;
    email: string;
    avatar?: string;
    type?: "individual" | "professional" | "pending";
    companyName?: string;
  };
  last_message_at: string;
  last_message: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  is_from_current_user?: boolean;
}

export function Messages() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { profile, loading: authLoading } = useAuth();
  const { sendMessage } = useMessaging();
  const { 
    notifications, 
    unreadCount: notificationUnreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    isLoading: notificationsLoading 
  } = useNotifications();

  const currentUserId = profile?.id?.toString();
  const currentConversation = selectedConversationId 
    ? conversations.find((c) => c.id === selectedConversationId)
    : null;

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConversationId && currentUserId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, currentUserId]);

  const loadConversations = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/messages-simple/user/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      if (!currentUserId) {
        setMessages([]);
        return;
      }

      const [vehicleId, userId1, userId2] = convId.split("|");
      const otherUserId = userId1 === currentUserId ? userId2 : userId1;

      const response = await fetch(`/api/messages-simple/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: Number(vehicleId),
          user1Id: currentUserId,
          user2Id: otherUserId,
        }),
      });

      if (response.ok) {
        const messagesData = await response.json();

        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.from_user_id,
          sender_name: msg.from_user_name,
          created_at: msg.created_at,
          is_from_current_user: msg.from_user_id === currentUserId,
        }));

        setMessages(formattedMessages);

        // Marquer comme lus
        const unreadMessageIds = messagesData
          .filter((msg: any) => msg.to_user_id === currentUserId && !msg.read)
          .map((msg: any) => msg.id);

        if (unreadMessageIds.length > 0) {
          fetch("/api/messages-simple/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageIds: unreadMessageIds,
              userId: currentUserId,
            }),
          });
          loadConversations();
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !currentUserId) return;

    const messageId = await sendMessage(selectedConversationId, newMessage, currentUserId);

    if (messageId) {
      setNewMessage("");
      loadMessages(selectedConversationId);
      loadConversations();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffHours < 24) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  // Fonctions pour les notifications
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }

    if (notification.data) {
      const data = notification.data as any;
      
      switch (notification.type) {
        case 'new_message':
        case 'message_reply':
          // Rester dans l'onglet messages
          setActiveTab('messages');
          if (data.conversationId) {
            setSelectedConversationId(data.conversationId);
          }
          break;
        
        case 'listing_validated':
        case 'listing_rejected':
        case 'listing_favorited':
        case 'listing_expiring':
          if (data.listingId) {
            navigate(`/vehicle/${data.listingId}`);
          }
          break;
        
        case 'new_follower':
          if (data.followerId) {
            navigate(`/professional/${data.followerId}`);
          }
          break;
        
        case 'followed_new_listing':
          if (data.listingId) {
            navigate(`/vehicle/${data.listingId}`);
          }
          break;
        
        case 'payment_success':
        case 'payment_failed':
        case 'subscription_ending':
          navigate('/subscription-settings');
          break;
        
        default:
          break;
      }
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent<HTMLButtonElement>, notificationId: number) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(notificationId);
  };

  const handleMarkAllNotificationsAsRead = async () => {
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

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Si une conversation est sélectionnée, afficher la vue conversation
  if (selectedConversationId && currentConversation) {
    const displayName = getUserDisplayName(currentConversation.other_user as any);
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div className="min-h-screen bg-white flex flex-col pb-20">
        {/* Header conversation */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-bolt-400 to-primary-bolt-600 rounded-full flex items-center justify-center">
              {currentConversation.other_user.avatar ? (
                <img
                  src={currentConversation.other_user.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white font-bold text-sm">{initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500">
                Dernière activité il y a plus de 30 j
              </p>
            </div>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 pb-24">
          {/* Carte annonce au début de la discussion */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 max-w-sm w-full">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {currentConversation.vehicle_image ? (
                    <img
                      src={currentConversation.vehicle_image}
                      alt={currentConversation.vehicle_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                    {currentConversation.vehicle_title}
                  </p>
                  {currentConversation.vehicle_price && (
                    <p className="text-base font-bold text-primary-bolt-600">
                      {currentConversation.vehicle_price.toLocaleString("fr-FR")} €
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">Aucun message</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate =
                index === 0 ||
                new Date(messages[index - 1].created_at).toDateString() !==
                  new Date(message.created_at).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                        {new Date(message.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${
                      message.is_from_current_user ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        message.is_from_current_user
                          ? "bg-pink-100 text-gray-900"
                          : "bg-white text-gray-900 shadow-sm"
                      }`}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input - fixé en bas, au-dessus du bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Votre message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
              data-testid="input-message"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-primary-bolt-600 text-white p-3 rounded-full hover:bg-primary-bolt-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher l'onglet notifications
  if (activeTab === "notifications") {
    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header avec onglets */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex">
            <button
              onClick={() => setActiveTab("messages")}
              className="flex-1 py-4 text-center text-gray-600 border-b-2 border-transparent"
              data-testid="tab-messages"
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className="flex-1 py-4 text-center text-gray-900 font-semibold border-b-2 border-primary-bolt-600"
              data-testid="tab-notifications"
            >
              Notifications
              {notificationUnreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {notificationUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Action marquer tout comme lu */}
        {notificationUnreadCount > 0 && (
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <button
              onClick={handleMarkAllNotificationsAsRead}
              className="text-sm text-primary-bolt-600 hover:text-primary-bolt-700 flex items-center gap-1 transition-colors"
              data-testid="button-mark-all-read"
            >
              <Check className="h-4 w-4" />
              Tout marquer comme lu
            </button>
          </div>
        )}

        {/* Liste des notifications */}
        <div>
          {notificationsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-bolt-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement des notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-4">
              <Bell className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Aucune notification</p>
              <p className="text-sm text-gray-400 text-center">
                Vous recevrez vos notifications ici
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50
                    ${!notification.read ? 'bg-blue-50 border-l-4 border-primary-bolt-500' : ''}
                  `}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-400">
                              {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </p>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Non lue
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="flex-shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Supprimer la notification"
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Liste des conversations (par défaut)
  return (
    <div className="min-h-screen bg-white">
      {/* Header avec onglets */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("messages")}
            className="flex-1 py-4 text-center text-gray-900 font-semibold border-b-2 border-primary-bolt-600"
            data-testid="tab-messages"
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className="flex-1 py-4 text-center text-gray-600 border-b-2 border-transparent"
            data-testid="tab-notifications"
          >
            Notifications
          </button>
        </div>
      </div>

      {/* Liste conversations */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-4 text-center text-gray-600">Chargement...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">Aucun message</p>
            <p className="text-sm text-gray-400">
              Vos conversations apparaîtront ici
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const displayName = getUserDisplayName(conv.other_user as any);
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                data-testid={`conversation-${conv.id}`}
              >
                {/* Photo de l'annonce */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {conv.vehicle_image ? (
                    <img
                      src={conv.vehicle_image}
                      alt={conv.vehicle_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <MessageSquare className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {displayName}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {conv.vehicle_title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-500 truncate flex-1">
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary-bolt-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count > 9 ? "9+" : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
