import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, ChevronRight, ChevronLeft } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayName } from "@/lib/utils";

interface Conversation {
  id: string;
  vehicle_id: string;
  vehicle_title: string;
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
  messages?: Message[];
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
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { sendMessage } = useMessaging();
  const { profile, loading: authLoading } = useAuth();

  const endRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentUserId = profile?.id?.toString();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsSidebarOpen(false); // Fermer la sidebar après sélection
    
    if (selectedConversation === conversationId) {
      loadMessages(conversationId);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const loadMessages = async (conversationId: string) => {
    try {
      if (!currentUserId) {
        setMessages([]);
        return;
      }

      const [vehicleId, userId1, userId2] = conversationId.split("-");
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
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const messageId = await sendMessage(selectedConversation, newMessage);

    if (messageId) {
      setNewMessage("");
      loadMessages(selectedConversation);
      loadConversations();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pb-16">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary-bolt-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile || !currentUserId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pb-16">
        <div className="text-center max-w-md mx-auto p-8">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous devez être connecté pour accéder à vos messages.
          </p>
          <button
            onClick={() => (window.location.href = "/auth")}
            className="bg-primary-bolt-600 hover:bg-primary-bolt-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            data-testid="button-login"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pb-16">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary-bolt-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-900 pb-16">
        <div className="text-center max-w-md p-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-primary-bolt-100 dark:bg-primary-bolt-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-primary-bolt-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Aucune conversation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Contactez un vendeur pour commencer une conversation
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-primary-bolt-600 hover:bg-primary-bolt-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              data-testid="button-browse-listings"
            >
              Parcourir les annonces
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex pb-16">
      {/* Barre latérale verticale collapsible */}
      <div
        className={`${
          isSidebarOpen ? "w-[75%]" : "w-[15%]"
        } bg-gradient-to-b from-primary-bolt-500 to-primary-bolt-600 transition-all duration-300 ease-in-out flex flex-col relative shadow-lg`}
      >
        {/* Bouton toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg z-10 hover:scale-110 transition-transform"
          data-testid="button-toggle-sidebar"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5 text-primary-bolt-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-primary-bolt-600" />
          )}
        </button>

        {/* Header */}
        <div className="p-4 border-b border-white/20">
          {isSidebarOpen ? (
            <h2 className="text-white font-bold text-lg">Messages</h2>
          ) : (
            <MessageCircle className="h-6 w-6 text-white mx-auto" />
          )}
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation, index) => {
            const isSelected = selectedConversation === conversation.id;
            const displayName = getUserDisplayName(conversation.other_user as any);
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                } ${isSidebarOpen ? "p-4" : "p-2"} border-b border-white/10`}
                data-testid={`conversation-${conversation.id}`}
              >
                {isSidebarOpen ? (
                  // Vue étendue
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        {conversation.other_user.avatar ? (
                          <img
                            src={conversation.other_user.avatar}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-primary-bolt-600 font-bold text-lg">
                            {initial}
                          </span>
                        )}
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate text-sm">
                        {displayName}
                      </p>
                      <p className="text-white/80 text-xs truncate">
                        {conversation.vehicle_title}
                      </p>
                      <p className="text-white/60 text-xs truncate mt-1">
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Vue compacte (juste initiale + badge)
                  <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary-bolt-600 font-bold text-sm">
                        {initial}
                      </span>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                        {conversation.unread_count > 9 ? "9" : conversation.unread_count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone de conversation principale */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {!selectedConversation ? (
          // État vide : sélectionner une conversation
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-bolt-100 dark:bg-primary-bolt-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-primary-bolt-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isSidebarOpen ? "Choisissez" : "Ouvrez le menu et choisissez"} une conversation pour commencer
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header de la conversation */}
            {currentConversation && (
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-bolt-400 to-primary-bolt-600 rounded-full flex items-center justify-center">
                    {currentConversation.other_user.avatar ? (
                      <img
                        src={currentConversation.other_user.avatar}
                        alt={getUserDisplayName(currentConversation.other_user as any)}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {getUserDisplayName(currentConversation.other_user as any)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {getUserDisplayName(currentConversation.other_user as any)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {currentConversation.vehicle_title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun message
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Commencez la conversation !
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.is_from_current_user ? "justify-end" : "justify-start"
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          message.is_from_current_user
                            ? "bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                        }`}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.is_from_current_user
                              ? "text-white/80"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </>
              )}
            </div>

            {/* Barre de saisie FIXÉE au-dessus du bottom menu */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message..."
                  className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-bolt-500 dark:bg-gray-700 dark:text-gray-100 max-h-24 min-h-[44px] text-sm"
                  rows={1}
                  data-testid="input-message"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
