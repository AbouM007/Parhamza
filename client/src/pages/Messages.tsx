import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Image as ImageIcon 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/hooks/useMessaging";
import { getUserDisplayName } from "@/lib/utils";

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
  const [match, params] = useRoute("/messages/:conversationId");
  const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { profile, loading: authLoading } = useAuth();
  const { sendMessage } = useMessaging();

  const currentUserId = profile?.id?.toString();
  const conversationId = params?.conversationId;
  const currentConversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (conversationId && currentUserId) {
      loadMessages(conversationId);
    }
  }, [conversationId, currentUserId]);

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

      // L'ID peut contenir des | (encodés en %7C dans l'URL, mais décodés par wouter)
      const [vehicleId, userId1, userId2] = convId.split("|");
      const otherUserId = userId1 === currentUserId ? userId2 : userId1;

      const response = await fetch(
        `/api/messages-simple/conversation?vehicleId=${vehicleId}&user1Id=${currentUserId}&user2Id=${otherUserId}`,
      );

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
    if (!newMessage.trim() || !conversationId || !currentUserId) return;

    const messageId = await sendMessage(conversationId, newMessage);

    if (messageId) {
      setNewMessage("");
      loadMessages(conversationId);
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

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vue Conversation détaillée
  if (conversationId) {
    // Attendre que les conversations soient chargées
    if (loading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Chargement de la conversation...</p>
          </div>
        </div>
      );
    }

    if (!currentConversation) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Conversation introuvable</p>
            <button
              onClick={() => navigate("/messages")}
              className="mt-4 text-primary-bolt-600 hover:underline"
            >
              Retour aux messages
            </button>
          </div>
        </div>
      );
    }
    const displayName = getUserDisplayName(currentConversation.other_user as any);
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div className="fixed inset-0 bg-white flex flex-col">
        {/* Header conversation */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
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

        {/* Carte annonce */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
              <p className="font-semibold text-gray-900 truncate">
                {currentConversation.vehicle_title}
              </p>
              {currentConversation.vehicle_price && (
                <p className="text-lg font-bold text-primary-bolt-600">
                  {currentConversation.vehicle_price.toLocaleString("fr-FR")} €
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                        {message.is_from_current_user && (
                          <span className="text-pink-500">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Barre de saisie */}
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex gap-2 items-center">
            <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Écrire un message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-bolt-500 text-sm"
              data-testid="input-message"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex-shrink-0"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue Liste des conversations
  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes messages</h1>

        {/* Onglets */}
        <div className="flex gap-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-3 px-1 relative ${
              activeTab === "messages"
                ? "text-primary-bolt-600 font-semibold"
                : "text-gray-600"
            }`}
            data-testid="tab-messages"
          >
            Messages
            {activeTab === "messages" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-bolt-600" />
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard?tab=notifications")}
            className={`pb-3 px-1 relative flex items-center gap-2 ${
              activeTab === "notifications"
                ? "text-primary-bolt-600 font-semibold"
                : "text-gray-600"
            }`}
            data-testid="tab-notifications"
          >
            Notifications
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              20
            </span>
            {activeTab === "notifications" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-bolt-600" />
            )}
          </button>
        </div>
      </div>

      {/* Liste des conversations */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Aucune conversation</p>
            <p className="text-sm text-gray-400">
              Vos messages apparaîtront ici
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {conversations.map((conversation) => {
            const displayName = getUserDisplayName(conversation.other_user as any);
            
            return (
              <div
                key={conversation.id}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                data-testid={`conversation-${conversation.id}`}
              >
                {/* Image annonce */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {conversation.vehicle_image ? (
                    <img
                      src={conversation.vehicle_image}
                      alt={conversation.vehicle_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate mb-0.5">
                    {conversation.vehicle_title}
                  </p>
                  <p className="text-sm text-gray-600 truncate mb-0.5">
                    {conversation.last_message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{displayName}</span>
                    <span>•</span>
                    <span>{formatDate(conversation.last_message_at)}</span>
                  </div>
                </div>

                {/* Badge non lu */}
                {conversation.unread_count > 0 && (
                  <div className="w-2 h-2 bg-primary-bolt-500 rounded-full flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
