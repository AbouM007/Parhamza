import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, Menu, X, ArrowLeft, Info } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayName } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { sendMessage } = useMessaging();
  const { profile, loading: authLoading } = useAuth();

  // Ref pour le scroll automatique vers le bas
  const endRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Si pas d'utilisateur connecté, ne pas définir currentUserId
  const currentUserId = profile?.id?.toString();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Fonction pour gérer le clic sur une conversation
  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsDrawerOpen(false); // Fermer le drawer après sélection
    
    if (selectedConversation === conversationId) {
      console.log("♻️ Rechargement de la conversation déjà ouverte");
      loadMessages(conversationId);
    }
  };

  // Scroll automatique vers le bas à chaque mise à jour des messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      console.log("📬 Chargement conversations pour utilisateur:", currentUserId);

      const response = await fetch(`/api/messages-simple/user/${currentUserId}`);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Conversations reçues:", data.conversations?.length || 0);
        setConversations(data.conversations || []);
      } else {
        console.error("❌ Erreur réponse conversations:", response.status);
      }
    } catch (error) {
      console.error("❌ Erreur chargement conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log("💬 Chargement messages pour conversation:", conversationId);

      if (!currentUserId) {
        console.error("❌ Pas d'utilisateur connecté");
        setMessages([]);
        return;
      }

      // Parser l'ID de conversation pour obtenir vehicleId et otherUserId
      const [vehicleId, userId1, userId2] = conversationId.split("-");
      const otherUserId = userId1 === currentUserId ? userId2 : userId1;

      console.log("📋 Paramètres:", {
        vehicleId,
        currentUserId,
        otherUserId,
      });

      const response = await fetch(
        `/api/messages-simple/conversation?vehicleId=${vehicleId}&user1Id=${currentUserId}&user2Id=${otherUserId}`,
      );

      if (response.ok) {
        const messagesData = await response.json();
        console.log("✅ Messages reçus:", messagesData.length);

        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.from_user_id,
          sender_name: msg.from_user_name,
          created_at: msg.created_at,
          is_from_current_user: msg.from_user_id === currentUserId,
        }));

        setMessages(formattedMessages);

        // Marquer les messages comme lus
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
        console.error("❌ Erreur chargement messages:", response.status);
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

  // Écran de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary-bolt-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Écran de connexion si pas d'utilisateur connecté
  if (!profile || !currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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

  // Écran de chargement des conversations
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-primary-bolt-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            Chargement des messages...
          </p>
        </div>
      </div>
    );
  }

  // État vide : pas de conversations
  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-900">
      {/* Drawer pour la liste des conversations */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
          <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary-bolt-600" />
              Conversations
            </SheetTitle>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedConversation === conversation.id
                    ? "bg-primary-bolt-50 dark:bg-primary-bolt-900/20"
                    : ""
                }`}
                data-testid={`conversation-${conversation.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-bolt-400 to-primary-bolt-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {conversation.other_user.avatar ? (
                      <img
                        src={conversation.other_user.avatar}
                        alt={getUserDisplayName(conversation.other_user as any)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getUserDisplayName(conversation.other_user as any)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {getUserDisplayName(conversation.other_user as any)}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                      {conversation.vehicle_title}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                        {conversation.last_message}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full ml-2 flex-shrink-0">
                          {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Vue principale */}
      {!selectedConversation ? (
        /* État initial : sélectionner une conversation */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-16 h-16 bg-primary-bolt-600 hover:bg-primary-bolt-700 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-105 shadow-lg"
                data-testid="button-open-conversations"
              >
                <Menu className="h-8 w-8 text-white" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Sélectionnez une conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vous avez {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
              </p>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="bg-primary-bolt-600 hover:bg-primary-bolt-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-view-conversations"
              >
                Voir les conversations
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Conversation active en plein écran */
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              data-testid="button-open-drawer"
            >
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            
            {currentConversation && (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-primary-bolt-400 to-primary-bolt-600 rounded-full flex items-center justify-center overflow-hidden">
                  {currentConversation.other_user.avatar ? (
                    <img
                      src={currentConversation.other_user.avatar}
                      alt={getUserDisplayName(currentConversation.other_user as any)}
                      className="w-full h-full object-cover"
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
              </>
            )}
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun message pour le moment
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
                    className={`flex ${message.is_from_current_user ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        message.is_from_current_user
                          ? "bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
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

          {/* Barre de saisie fixée en bas */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2 items-end">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-bolt-500 dark:bg-gray-700 dark:text-gray-100 max-h-32 min-h-[48px]"
                rows={1}
                data-testid="input-message"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105"
                data-testid="button-send"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
